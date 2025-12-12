const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 300000; // 5 minutes

/**
 * Envoie le fichier audio au moteur IA (Python)
 */
const transcribeAudio = async (filePath, originalName) => {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));

  try {
    const response = await axios.post(`${AI_URL}/transcribe`, formData, {
      headers: { ...formData.getHeaders() },
      timeout: TIMEOUT_MS,
    });
    return response.data;
  } catch (error) {
    // On propage l'erreur avec un message clair
    throw new Error(`AI Engine unavailable: ${error.message}`);
  }
};

module.exports = { transcribeAudio };
