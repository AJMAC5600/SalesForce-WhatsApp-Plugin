const axios = require("axios");
const db = require("../config/database"); // Assuming you have a database module set up for SQLite

const fetchContacts = () => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT access_token, instance_url FROM responce WHERE id = 1",
      async (err, row) => {
        if (err) {
          console.error("Error fetching access_token from database:", err);
          return reject({
            error: "Database error while fetching access token",
            details: err,
          });
        }

        if (!row) {
          console.error("No access token found in the database.");
          return reject({ error: "Access token not found in the database" });
        }

        const { access_token: accessToken, instance_url: instanceUrl } = row;

        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        const query = "SELECT Id, Name, Phone FROM Contact";
        const url = `${instanceUrl}/services/data/v52.0/query/?q=${encodeURIComponent(
          query
        )}`;

        try {
          const response = await axios.get(url, { headers });

          if (response.data && response.data.records) {
            const filteredData = response.data.records.map((record) => ({
              id: record.Id || null,
              name: record.Name || null,
              phone: record.Phone || null,
            }));

            resolve(filteredData); // Resolve the promise with filtered data
          } else {
            console.error("Unexpected Salesforce response:", response.data);
            reject({
              error: "Unexpected response from Salesforce API",
              details: response.data,
            });
          }
        } catch (error) {
          console.error("Error fetching contacts from Salesforce:", error);
          reject({
            error: "Error fetching contacts from Salesforce",
            details: error.response ? error.response.data : error.message,
          });
        }
      }
    );
  });
};

module.exports = { fetchContacts };
