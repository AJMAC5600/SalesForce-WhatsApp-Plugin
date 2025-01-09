const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const oauthRoutes = require("./routes/oauthRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { startTokenRefresh } = require("./controllers/oauthController");
const templateRoutes = require("./routes/templateRoutes");
const { fetchContacts } = require("./controllers/salesforceController");

dotenv.config();
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.static(path.join(__dirname, "assets"))); // Serve static files
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Start the token refresh process
startTokenRefresh();

app.get("/template-selection", async (req, res) => {
  try {
    const contacts = await getContactsFromHubSpot(); // Function to fetch contacts
    const channels = await getChannels(); // Function to fetch channels
    const categories = await getCategories(); // Function to fetch categories
    const templates = await getTemplates(); // Function to fetch templates

    res.render("templateSelection", {
      contacts,
      channels,
      categories,
      templates,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

// Set the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Use OAuth routes
app.use(oauthRoutes);
app.use(settingsRoutes);
app.use(templateRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
