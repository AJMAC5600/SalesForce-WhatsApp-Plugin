const axios = require("axios");
const db = require("../config/database"); // Assuming you have a database module set up for MySQL

// Function to fetch the API key from the database
const getApiKeyFromDb = async () => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT whatsappApiKey FROM settings WHERE id = 1",
      (err, results) => {
        if (err) {
          console.error("Error fetching API key from database:", err);
          reject(err);
        }

        if (results) {
          resolve(results.whatsappApiKey); // Directly access the whatsappApiKey from the result object
        } else {
          reject(new Error("API key not found in the database"));
        }
      }
    );
  });
};

// Function to send a WhatsApp message
const sendWhatsAppMessage = async (contact, jsonbody, channelNumber) => {
  try {
    const apiKey = await getApiKeyFromDb(); // Fetch the API key from the database
    const whatsappApiUrl = `${process.env.WHATSAPP_API_URL}/api/v1.0/messages/send-template/${channelNumber}`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    let body = jsonbody;
    let phone = contact.replace("+", ""); // Remove non-numeric characters
    body.to = `91${phone}`; // Assuming the phone number is in India (+91), update this if needed

    const response = await fetch(whatsappApiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("WhatsApp Message Sent:", result);
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
  }
};

// Function to retrieve channel data from the API
const getChannelsFromAPI = async () => {
  try {
    const apiKey = await getApiKeyFromDb(); // Fetch the API key from the database
    const apiUrl = `${process.env.WHATSAPP_API_URL}/api/v1.0/channels`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`Error fetching channels: ${response.statusText}`);
    }

    const result = await response.json();
    return result || []; // Return empty array if no result
  } catch (error) {
    console.error("Error fetching channels:", error);
    return []; // Return an empty array in case of error
  }
};

// Function to fetch channel templates
const getChannelTemplates = async (channelNumber) => {
  try {
    const apiKey = await getApiKeyFromDb(); // Fetch the API key from the database
    const apiUrl = `${process.env.WHATSAPP_API_URL}/api/v1.0/channel-templates/${channelNumber}`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(
        `Error fetching channel templates: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching channel templates:", error);
    throw error;
  }
};

// Function to fetch template payload
const fetchTemplatePayload = async (templateName, channelNumber) => {
  try {
    const apiKey = await getApiKeyFromDb(); // Fetch the API key from the database
    const apiUrl = `${process.env.WHATSAPP_API_URL}/api/v1.0/template-payload/${channelNumber}/${templateName}`;

    const headers = {
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(apiUrl, { method: "GET", headers });

    if (!response.ok) {
      throw new Error(`Error fetching template: ${response.statusText}`);
    }

    const result = await response.json();
    return result; // Return the result for further processing
  } catch (error) {
    console.error("Error fetching template:", error);
    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  getChannelsFromAPI,
  getChannelTemplates,
  fetchTemplatePayload,
};
