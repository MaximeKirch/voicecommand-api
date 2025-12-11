const jwt = require("jsonwebtoken");
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev_secret_key";

module.exports = (req, res, next) => {
  try {
    // 1. Récupérer le header Authorization
    const authHeader = req.headers.authorization;

    // Vérification basique : est-ce que le header existe ?
    if (!authHeader) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No token provided" });
    }

    // 2. Extraire le token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Authentication failed: Malformed token" });
    }

    // 3. Vérifier la signature du token
    const decodedToken = jwt.verify(token, JWT_ACCESS_SECRET);

    // 4. Injecter les infos utilisateur dans la requête
    req.user = {
      userId: decodedToken.userId,
      email: decodedToken.email,
    };

    // 5. Laisser passer
    next();
  } catch (error) {
    // Si jwt.verify échoue (token expiré ou modifié), ça tombe ici
    console.error("Auth Middleware Error:", error.message);
    return res
      .status(401)
      .json({ message: "Authentication failed: Invalid token" });
  }
};
