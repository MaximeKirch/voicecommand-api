const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
// const { v4: uuidv4 } = require("uuid");

// Configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

// Durées
const ACCESS_TOKEN_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION_DAYS = 30;

// --- Helper: Générer les tokens ---
async function generateTokens(user) {
  // 1. Access Token (Léger, pour les requêtes API)
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION },
  );

  // 2. Refresh Token (Opaque, pour la DB)
  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRATION_DAYS}d` },
  );

  // Calcul date expiration DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

  // 3. Sauvegarde en DB (Lier au user)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: expiresAt,
    },
  });

  return { accessToken, refreshToken, expiresAt };
}

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing data" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(409).json({ message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const tokens = await generateTokens(newUser);

    return res.status(201).json({
      message: "User created",
      auth: {
        ...tokens, // Renvoie accessToken, refreshToken, expiresAt
      },
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Internal Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing data" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = await generateTokens(user);

    return res.status(200).json({
      message: "Login successful",
      auth: {
        ...tokens,
      },
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal Error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh Token required" });
    }

    // 1. Vérifier la signature du Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Invalid Refresh Token signature" });
    }

    // 2. Vérifier en DB (Est-il révoqué ? Existe-t-il ?)
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !savedToken ||
      savedToken.revoked ||
      new Date() > savedToken.expiresAt
    ) {
      // Sécurité : Si on tente d'utiliser un vieux token ou un token volé, on bloque tout.
      return res
        .status(401)
        .json({ message: "Invalid or Expired Refresh Token" });
    }

    // 3. ROTATION DES TOKENS
    // On révoque l'ancien token utilisé (pour qu'il ne serve qu'une fois)
    await prisma.refreshToken.update({
      where: { id: savedToken.id },
      data: { revoked: true },
    });

    // 4. On génère un NOUVEAU couple
    const newTokens = await generateTokens(savedToken.user);

    return res.status(200).json({
      message: "Token refreshed",
      ...newTokens,
    });
  } catch (error) {
    console.error("Refresh Error:", error);
    return res.status(500).json({ message: "Internal Error" });
  }
};
