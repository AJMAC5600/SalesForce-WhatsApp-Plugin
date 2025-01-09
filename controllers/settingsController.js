// Temporary in-memory store for settings
let settingsStore = {};

// Render the settings page
const renderSettingsPage = (req, res) => {
  res.render("settings", { message: undefined });
};

// Save the settings
const saveSettings = (req, res) => {
  const { hubspotClientId, hubspotClientSecret, whatsappApiKey } = req.body;

  if (!hubspotClientId || !hubspotClientSecret || !whatsappApiKey) {
    return res.status(400).send("All fields are required.");
  }

  // Save settings to the in-memory store (replace with database for production)
  settingsStore = { hubspotClientId, hubspotClientSecret, whatsappApiKey };

  console.log("Settings saved:", settingsStore);

  // Redirect to the settings page with a success message
  res.render("settings", { message: "Settings saved successfully!" });
};

module.exports = { renderSettingsPage, saveSettings };
