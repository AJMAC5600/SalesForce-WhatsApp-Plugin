const express = require("express");
const db = require("../config/database");
const {
  renderSettingsPage,
  saveSettings,
} = require("../controllers/settingsController");

const router = express.Router();

// Route to render the settings page
router.get("/", renderSettingsPage);

// Route to save the settings
router.post("/settings/save", (req, res) => {
  const { salesforceClientId, salesforceClientSecret, whatsappApiKey } =
    req.body;

  // Query to check if the settings with id = 1 already exist
  const checkQuery = "SELECT * FROM settings WHERE id = 1";

  db.get(checkQuery, (err, result) => {
    if (err) {
      console.error("Error checking settings:", err);
      return res.status(500).send("Error checking settings.");
    }

    if (result) {
      // If the settings with id = 1 already exist, update the record
      const updateQuery = `
        UPDATE settings 
        SET salesforceClientId = ?, salesforceClientSecret = ?, whatsappApiKey = ? 
        WHERE id = 1
      `;

      db.run(
        updateQuery,
        [salesforceClientId, salesforceClientSecret, whatsappApiKey],
        (err) => {
          if (err) {
            console.error("Error updating settings:", err);
            return res.status(500).send("Error updating settings.");
          }

          // Respond with success and a link to initiate OAuth
          res.render("oauth");
        }
      );
    } else {
      // If the settings with id = 1 don't exist, insert a new record
      const insertQuery = `
        INSERT INTO settings (id, salesforceClientId, salesforceClientSecret, whatsappApiKey)
        VALUES (1, ?, ?, ?)
      `;

      db.run(
        insertQuery,
        [salesforceClientId, salesforceClientSecret, whatsappApiKey],
        (err) => {
          if (err) {
            console.error("Error saving settings:", err);
            return res.status(500).send("Error saving settings.");
          }

          // Respond with success and a link to initiate OAuth
          res.render("oauth");
        }
      );
    }
  });
});

module.exports = router;
