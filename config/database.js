const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Define the path to your SQLite database file
const dbPath = path.join(__dirname, "salesforce_plugin.db");

// Create a connection to the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to SQLite:", err.message);
    return;
  }
  console.log("Connected to SQLite database.");
});

// Function to create tables if they don't already exist
const createTables = () => {
  // Create 'settings' table
  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      salesforceClientId TEXT NOT NULL,
      salesforceClientSecret TEXT NOT NULL,
      whatsappApiKey TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT
    );
  `;

  db.run(createSettingsTable, (err) => {
    if (err) {
      console.error("Error creating 'settings' table:", err.message);
    } else {
      console.log("'settings' table is ready.");
    }
  });

  // Create 'responce' table
  const createResponseTable = `
    CREATE TABLE IF NOT EXISTS responce (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_token TEXT,
      refresh_token TEXT,
      signature TEXT NOT NULL,
      instance_url TEXT NOT NULL,
      issued_at TEXT NOT NULL
    );
  `;

  db.run(createResponseTable, (err) => {
    if (err) {
      console.error("Error creating 'responce' table:", err.message);
    } else {
      console.log("'responce' table is ready.");
    }
  });
};

// Call the function to create tables
createTables();

module.exports = db;
