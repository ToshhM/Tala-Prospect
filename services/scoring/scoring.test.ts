import { describe, it, expect } from "vitest";
import { calculateOpportunityScore } from "./scoring";

describe("calculateOpportunityScore", () => {
  it("should score a perfect Talaref core mission highly", () => {
    const opp = {
      title: "Shooting Photo Corporate Urgent",
      description: "Nous recherchons un photographe pro à Paris pour réaliser un shooting de nos locaux. Budget max de 2500 €.",
      location: "Paris 8ème",
      publishedAt: new Date(), // Just published
      contractType: "Freelance",
      budgetMin: 2500,
      budgetMax: 2500,
      isDirectClient: true,
      isUrgent: true,
      contactEmail: "contact@talentsolutions.fr",
    };

    const result = calculateOpportunityScore(opp);
    
    // Core Category PHOTO (+20)
    // Budget >= 2000 (+30)
    // Paris (+20)
    // Contact Direct (+15)
    // Recent <= 48h (+10)
    // Direct Client (+10)
    // Urgent (+10)
    // Freelance (+10)
    // Total = 125, clamped to 100.
    expect(result.score).toBe(100);
    expect(result.priority).toBe("CRITIQUE");
    expect(result.scoreReasons.length).toBeGreaterThan(5);
  });

  it("should penalize CDI classical job and low budget", () => {
    const opp = {
      title: "Monteur Vidéo en CDI",
      description: "Nous recherchons un monteur vidéo CDI pour éditer nos vidéos Tiktok. Salaire annuel faible.",
      location: "Bordeaux",
      publishedAt: new Date(Date.now() - 20 * 24 * 3600000), // 20 days ago
      contractType: "CDI",
      budgetMax: 400, // low budget
    };

    const result = calculateOpportunityScore(opp);
    
    // Video (+20)
    // CDI (-20)
    // Old (>15 days) (-30)
    // Low budget (<500) (-20)
    // Total should be negative/low, clamped to 0.
    expect(result.score).toBe(0);
    expect(result.priority).toBe("FAIBLE");
  });
});
