const billingService = require("../services/billingService");
// L'ordre est important : on mocke AVANT, puis on require pour récupérer le mock
const { exec } = require("child_process");

// --- MOCKS ---

// 1. Mock de Prisma (Correction de l'erreur "out-of-scope")
jest.mock("../prismaClient", () => {
  // On définit l'objet mock à l'intérieur pour éviter l'erreur de référence
  const mockClient = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    creditTransaction: {
      create: jest.fn(),
    },
  };

  // La magie pour la transaction : on fait en sorte qu'elle s'appelle elle-même
  // Comme ça "tx" dans ton code sera égal à "mockClient"
  mockClient.$transaction = jest.fn((callback) => callback(mockClient));

  return mockClient;
});

// On récupère le mock qu'on vient de définir pour pouvoir faire des "expect" dessus
const prisma = require("../prismaClient");

// 2. Mock de child_process (version callback standard)
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("BillingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- CAS 1 : DURÉE COURTE ---
  test("Doit coûter 1 crédit pour un fichier de 30 secondes", async () => {
    // Setup : exec appelle le callback avec stdout="30.5"
    exec.mockImplementation((cmd, callback) => {
      callback(null, "30.5", "");
    });

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      credits: 10,
      email: "test@test.com",
    });
    prisma.user.update.mockResolvedValue({ id: 1, credits: 9 });

    const result = await billingService.chargeUser(1, "fake.mp3");

    expect(result.cost).toBe(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { credits: { decrement: 1 } },
    });
  });

  // --- CAS 2 : DURÉE LONGUE ---
  test("Doit coûter 2 crédits pour un fichier de 65 secondes", async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(null, "65.0", ""); // stdout peut être une string directe aussi
    });

    prisma.user.findUnique.mockResolvedValue({ id: 1, credits: 10 });
    prisma.user.update.mockResolvedValue({ id: 1, credits: 8 });

    const result = await billingService.chargeUser(1, "fake.mp3");

    expect(result.cost).toBe(2);
  });

  // --- CAS 3 : SOLDE INSUFFISANT ---
  test("Doit jeter une erreur si solde insuffisant", async () => {
    exec.mockImplementation((cmd, callback) => {
      callback(null, "60.0", "");
    });

    // User a 0 crédit
    prisma.user.findUnique.mockResolvedValue({ id: 1, credits: 0 });

    await expect(billingService.chargeUser(1, "fake.mp3")).rejects.toThrow(
      "Insufficient credits",
    );

    // Vérifier qu'on a RIEN débité
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
