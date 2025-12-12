const fs = require("fs");
const billingService = require("../services/billingService");
const aiService = require("../services/aiService");

exports.processVoice = async (req, res) => {
  // 1. Validation de l'entrée
  if (!req.file) {
    return res.status(400).json({ message: "No audio file provided" });
  }

  try {
    console.log(
      `[Job Start] User ${req.user.userId} processing ${req.file.originalname}`,
    );

    // 2. Facturation (Fail-Fast)
    const billingResult = await billingService.chargeUser(
      req.user.userId,
      req.file.path,
    );

    console.log(`[Billing] OK. Cost: ${billingResult.cost}`);

    // 3. Appel au Service IA
    const aiData = await aiService.transcribeAudio(
      req.file.path,
      req.file.originalname,
    );

    // 4. Réponse
    return res.json({
      success: true,
      data: aiData,
      usage: aiData.usage,
      billing: {
        cost: billingResult.cost,
        remaining_credits: billingResult.newBalance,
      },
    });
  } catch (error) {
    console.error("[Process Error]", error.message);

    // Gestion des erreurs spécifiques
    if (error.code === "INSUFFICIENT_FUNDS") {
      return res.status(402).json({
        error: "Payment Required",
        message: error.message,
        details: { cost: error.required, balance: error.balance },
      });
    }

    return res.status(500).json({
      error: "Processing failed",
      details: error.message,
    });
  } finally {
    // 5. Nettoyage (Cleanup)
    // On nettoie TOUJOURS, succès ou échec.
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[Cleanup] Deleted ${req.file.path}`);
      } catch (err) {
        console.error("[Cleanup Error]", err);
      }
    }
  }
};
