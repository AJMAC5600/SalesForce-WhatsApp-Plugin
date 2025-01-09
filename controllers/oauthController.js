const axios = require("axios");
const crypto = require("crypto");
const db = require("../config/database");

// Function to generate code verifier and challenge
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(codeVerifier) {
  const sha256 = crypto.createHash("sha256");
  sha256.update(codeVerifier);
  return sha256.digest("base64url");
}

// In-memory session store (replace for production)
let session = {};

// Handle OAuth Redirect
const handleOAuthRedirect = (req, res) => {
  db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
    if (err) {
      console.error("Error fetching settings from database:", err);
      return res.status(500).send("Error loading settings from database");
    }

    if (settings) {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // Store codeVerifier in session
      session.codeVerifier = codeVerifier;

      const authURL = `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${settings.salesforceClientId}&redirect_uri=${process.env.SALESFORCE_REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

      res.redirect(authURL); // Redirect the user to Salesforce OAuth
    } else {
      console.error("No settings found in the database");
      res.status(404).send("Settings not found in the database");
    }
  });
};

// Handle Callback
const handleCallback = async (req, res) => {
  const { code } = req.query; // Authorization code
  const codeVerifier = session.codeVerifier;

  if (!code || !codeVerifier) {
    return res.status(400).json({ error: "Missing code or code verifier" });
  }

  try {
    db.get("SELECT * FROM settings WHERE id = 1", async (err, settings) => {
      if (err) {
        console.error("Error fetching settings from database:", err);
        return res.status(500).send("Error loading settings from database");
      }

      if (settings) {
        const { salesforceClientId, salesforceClientSecret } = settings;
        const redirect_uri = process.env.SALESFORCE_REDIRECT_URI;
        const auth_url = process.env.SALESFORCE_AUTH_URL;

        try {
          const response = await axios.post(auth_url, null, {
            params: {
              grant_type: "authorization_code",
              code: code,
              client_id: salesforceClientId,
              client_secret: salesforceClientSecret,
              redirect_uri: redirect_uri,
              code_verifier: codeVerifier,
            },
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          db.get("SELECT id FROM responce WHERE id = 1", (err, existingRow) => {
            if (err) {
              console.error("Error checking row existence:", err);
              return res
                .status(500)
                .json({ error: "Database error", details: err });
            }

            const query = existingRow
              ? "UPDATE responce SET access_token = ?, refresh_token = ?, signature = ?, instance_url = ?, issued_at = ? WHERE id = 1"
              : "INSERT INTO responce (id, access_token, refresh_token, signature, instance_url, issued_at) VALUES (1, ?, ?, ?, ?, ?)";
            const values = [
              response.data.access_token,
              response.data.refresh_token,
              response.data.signature,
              response.data.instance_url,
              response.data.issued_at,
            ];

            db.run(query, values, (err) => {
              if (err) {
                console.error("Error saving token to database:", err);
                return res
                  .status(500)
                  .json({ error: "Database error", details: err });
              }

              console.log("Access token and refresh token saved successfully.");
              res.redirect("/templates"); // Redirect to the templates page
            });
          });
        } catch (tokenError) {
          console.error("Error obtaining access token:", tokenError);
          res.status(400).json({
            error: "Error obtaining access token",
            details: tokenError.response
              ? tokenError.response.data
              : tokenError.message,
          });
        }
      } else {
        res.status(404).send("Settings not found in the database");
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Unexpected error", details: error.message });
  }
};

// Refresh Token Periodically
const startTokenRefresh = () => {
  setInterval(async () => {
    console.log("Refreshing access token...");

    db.get("SELECT * FROM settings WHERE id = 1", (err, settings) => {
      if (err) {
        console.error("Error fetching settings:", err);
        return;
      }

      if (settings) {
        db.get("SELECT * FROM responce WHERE id = 1", async (err, responce) => {
          if (err) {
            console.error("Error fetching responce:", err);
            return;
          }

          if (responce) {
            const { refresh_token, instance_url } = responce;
            const token_url = `${instance_url}/services/oauth2/token`;

            try {
              const response = await axios.post(token_url, null, {
                params: {
                  grant_type: "refresh_token",
                  client_id: settings.salesforceClientId,
                  client_secret: settings.salesforceClientSecret,
                  refresh_token: refresh_token,
                },
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              });

              const updateQuery =
                "UPDATE responce SET access_token = ?, issued_at = ? WHERE id = 1";
              const updateValues = [
                response.data.access_token,
                response.data.issued_at,
              ];

              db.run(updateQuery, updateValues, (err) => {
                if (err) {
                  console.error("Error updating access token:", err);
                } else {
                  console.log("Access token refreshed successfully.");
                }
              });
            } catch (refreshError) {
              console.error(
                "Error refreshing access token:",
                refreshError.response
                  ? refreshError.response.data
                  : refreshError.message
              );
            }
          } else {
            console.error("No refresh token found.");
          }
        });
      } else {
        console.error("No settings found.");
      }
    });
  }, 5 * 60 * 1000); // Refresh every 5 minutes
};

module.exports = {
  handleOAuthRedirect,
  handleCallback,
  startTokenRefresh,
};
