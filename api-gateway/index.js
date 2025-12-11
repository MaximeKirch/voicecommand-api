const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const { login, signup, refreshToken } = require("./auth/index");
const authMiddleware = require("./middleware/auth");

const app = express();
const upload = multer({ dest: "uploads/" });
const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const FIVE_MINUTES_IN_MS = 300000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Gateway is running.");
});

app.post("/auth/signup", signup);
app.post("/auth/login", login);
app.post("/auth/refresh", refreshToken);

app.post(
  "/process-voice",
  authMiddleware,
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No audio file provided");
    }

    try {
      console.log(`Received file: ${req.file.originalname}, sending to AI...`);

      // Préparer le fichier pour l'envoi au service Python
      const formData = new FormData();
      formData.append("file", fs.createReadStream(req.file.path));

      const aiResponse = await axios.post(`${AI_URL}/transcribe`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: FIVE_MINUTES_IN_MS,
      });

      // Réponse au client
      res.json({
        success: true,
        data: aiResponse.data,
      });
    } catch (error) {
      console.error("Error talking to AI Service:", error.message);
      // On renvoie l'erreur au client pour qu'il sache ce qui s'est passé
      res
        .status(500)
        .json({ error: "AI processing failed", details: error.message });
    } finally {
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log(`Cleaned up file: ${req.file.path}`);
        } catch (err) {
          console.error("Error deleting file:", err);
        }
      }
    }
  },
);

app.listen(3000, () => {
  console.log("Gateway listening on port 3000");
});
