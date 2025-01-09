const express = require("express");
const {
  handleOAuthRedirect,
  handleCallback,
} = require("../controllers/oauthController");
const { fetchContacts } = require("../controllers/salesforceController");

const router = express.Router();

// Route to start the OAuth process
router.get("/oauth", handleOAuthRedirect);

// Route to handle the callback
router.get("/callback", handleCallback);

// Define the route for fetching contacts
router.get("/fetch-contacts", fetchContacts);

module.exports = router;
