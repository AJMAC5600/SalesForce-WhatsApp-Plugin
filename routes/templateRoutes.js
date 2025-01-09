const express = require("express");
const {
  sendWhatsAppMessage,
  getChannelsFromAPI,
  getChannelTemplates,
  fetchTemplatePayload,
} = require("../controllers/whatsappController"); // Import functions from the controller
const { fetchContacts } = require("../controllers/salesforceController");
const router = express.Router();

// Middleware to parse JSON and URL-encoded bodies
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Route to load template selection page
router.get("/templates", async (req, res) => {
  try {
    // Fetch channels dynamically from the API
    const channels = await getChannelsFromAPI();

    // Static data for categories and contacts
    const categories = ["MARKETING", "UTILITY", "AUTHENTICATION"];
    const contacts = await fetchContacts();

    // Render the template selection page with empty templates initially
    res.render("templateSelection", {
      categories,
      channels,
      templates: [], // Empty initially
      contacts,
    });
  } catch (error) {
    console.error("Error fetching data for template selection:", error);
    res.status(500).send("Error fetching data for template selection.");
  }
});

// Fetch template data from API
const fetchTemplateFromRequest = async (req, res) => {
  const { template, channel } = req.body;

  if (!template || !channel) {
    return res.status(400).send("Template or channel not provided");
  }

  try {
    // Fetch the template payload from the API
    const templateData = await fetchTemplatePayload(template, channel);

    // Return the template data to the frontend
    res.json({ success: true, template: templateData });
  } catch (error) {
    console.error("Error fetching template payload:", error);
    res.status(500).send("Error fetching template data");
  }
};

// Route to fetch template data
router.post("/templates/fetch", fetchTemplateFromRequest);

// Route to handle fetching templates for a selected channel
router.post("/save-channel", async (req, res) => {
  const { channel } = req.body;

  if (!channel) {
    return res.status(400).json({ error: "Channel is required." });
  }

  try {
    // Fetch templates for the selected channel
    const templates = await getChannelTemplates(channel);

    // Send the templates back as a JSON response
    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching channel templates:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch templates." });
  }
});

// Route to handle form submission (send messages)
router.post("/submit-endpoint", async (req, res) => {
  const { updatedJsonbody, contact, channel } = req.body;

  // Input validation
  if (!updatedJsonbody || !channel) {
    return res.status(400).send("Updated JSON body or channel not provided.");
  }

  try {
    // Fetch salesforce contacts
    const contacts = await fetchContacts();

    // Extract phone numbers from contacts
    let phoneNumbers = contacts.map((contact) => contact.phone);
    // console.log(phoneNumbers);

    if (contact) {
      // Send message to all phone numbers
      phoneNumbers.forEach((phoneNumber) => {
        sendWhatsAppMessage(phoneNumber, updatedJsonbody, channel);
      });
    } else if (Array.isArray(contact)) {
      // Send message to all selected contacts
      contact.forEach((contact) => {
        sendWhatsAppMessage(contact, updatedJsonbody, channel);
      });
    } else {
      // Send message to the selected contact
      sendWhatsAppMessage(contact, updatedJsonbody, channel);
    }

    // Respond with success message
    res.send("Messages sent successfully!");
  } catch (error) {
    console.error("Error sending messages:", error);
    res.status(500).send("Error sending messages.");
  }
});

module.exports = router;
