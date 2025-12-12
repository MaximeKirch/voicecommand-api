require("dotenv").config();
const express = require("express");
const multer = require("multer");

// Imports Architecture
const authController = require("./auth/index");
const voiceController = require("./controllers/voiceController");
const authMiddleware = require("./middleware/auth");

// Configuration
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: "uploads/" });

// Middlewares globaux
app.use(express.json());

// --- ROUTES ---

// Health Check
app.get("/", (req, res) => res.send("API Gateway is running 🚀"));

// Auth Routes
app.post("/auth/signup", authController.signup);
app.post("/auth/login", authController.login);
app.post("/auth/refresh", authController.refreshToken);

// Feature Routes
app.post(
  "/process-voice",
  authMiddleware,
  upload.single("audio"), // 2. Uploader
  voiceController.processVoice, // 3. Traiter
);

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Gateway listening on port ${PORT}`);
});
