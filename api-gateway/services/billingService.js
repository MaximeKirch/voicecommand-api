const { exec } = require("child_process");
const prisma = require("../prismaClient");

/**
 * Récupère la durée audio via la commande système ffprobe.
 * Utilise child_process.exec (Callback style) pour faciliter le mocking.
 */
const getAudioDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    // Commande pour récupérer juste la durée en secondes
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;

    // On utilise exec avec un callback standard (err, stdout, stderr)
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // En cas d'erreur système (ex: fichier introuvable)
        return reject(error);
      }

      // Nettoyage et parsing du résultat
      const duration = parseFloat(stdout.trim());

      if (isNaN(duration)) {
        return reject(new Error("Invalid duration parsed from ffprobe"));
      }

      resolve(duration);
    });
  });
};

const chargeUser = async (userId, audioFilePath) => {
  try {
    // 1. Calculer la durée réelle
    const durationInSeconds = await getAudioDuration(audioFilePath);

    // 2. Règle métier : 1 crédit par tranche de 60 secondes entamée
    const cost = Math.max(1, Math.ceil(durationInSeconds / 60));

    // 3. Transaction Atomique
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (!user) throw new Error("User not found");

      if (user.credits < cost) {
        const error = new Error("Insufficient credits");
        error.code = "INSUFFICIENT_FUNDS";
        error.required = cost;
        error.balance = user.credits;
        throw error;
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: cost } },
      });

      await tx.creditTransaction.create({
        data: {
          userId: userId,
          amount: -cost,
          description: `Analysis: ${Math.round(durationInSeconds)}s audio`,
        },
      });

      return {
        success: true,
        newBalance: updatedUser.credits,
        cost: cost,
        duration: durationInSeconds,
      };
    });
  } catch (error) {
    // On relance l'erreur pour qu'elle soit gérée par le contrôleur
    throw error;
  }
};

module.exports = { chargeUser };
