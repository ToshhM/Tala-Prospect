import { detectCategory } from "./categorization";

export interface ScoringResult {
  score: number;
  scoreReasons: string[];
  priority: "FAIBLE" | "MOYENNE" | "HAUTE" | "CRITIQUE";
}

export function calculateOpportunityScore(opportunity: {
  title: string;
  description: string;
  location: string;
  publishedAt: Date;
  contractType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  isDirectClient?: boolean;
  isUrgent?: boolean;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  category?: string | null;
}): ScoringResult {
  let score = 0;
  const scoreReasons: string[] = [];

  // Determine category if not already provided
  const catInfo = detectCategory(opportunity.title, opportunity.description);
  const category = opportunity.category || catInfo.category;

  // 1. Budget Rule
  const budget = opportunity.budgetMax || opportunity.budgetMin;
  if (budget && budget >= 2000) {
    score += 30;
    scoreReasons.push("Budget élevé (>= 2000 €) [+30]");
  } else if (budget && budget < 500) {
    score -= 20;
    scoreReasons.push("Budget faible (< 500 €) [-20]");
  }

  // 2. Location Rule (Paris / Île-de-France)
  const loc = opportunity.location.toLowerCase();
  const isIDF =
    loc.includes("paris") ||
    loc.includes("75") ||
    loc.includes("92") ||
    loc.includes("93") ||
    loc.includes("94") ||
    loc.includes("77") ||
    loc.includes("78") ||
    loc.includes("91") ||
    loc.includes("95") ||
    loc.includes("île-de-france") ||
    loc.includes("ile de france");
  if (isIDF) {
    score += 20;
    scoreReasons.push("Localisé à Paris / Île-de-France [+20]");
  }

  // 3. Category Rule
  const isCoreCategory = ["PHOTO", "VIDEO", "EVENT"].includes(category);
  if (isCoreCategory) {
    score += 20;
    scoreReasons.push(`Métier cœur Talaref (${category}) [+20]`);
  }

  // 4. Contact Direct
  const hasDirectContact = !!(
    opportunity.contactEmail ||
    opportunity.contactPhone ||
    opportunity.contactName
  );
  if (hasDirectContact) {
    score += 15;
    scoreReasons.push("Contact direct disponible [+15]");
  }

  // 5. Age of offer
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(opportunity.publishedAt).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

  if (diffHours <= 48) {
    score += 10;
    scoreReasons.push("Publiée il y a moins de 48h [+10]");
  } else if (diffDays > 15) {
    score -= 30;
    scoreReasons.push("Publication ancienne (> 15 jours) [-30]");
  }

  // 6. Direct Client
  if (opportunity.isDirectClient) {
    score += 10;
    scoreReasons.push("Client direct [+10]");
  }

  // 7. Urgency
  if (opportunity.isUrgent) {
    score += 10;
    scoreReasons.push("Urgence détectée [+10]");
  }

  // 8. Contract Type (Freelance vs CDI / Stage)
  const contract = (opportunity.contractType || "").toLowerCase();
  const isFreelance =
    contract.includes("freelance") ||
    contract.includes("indépendant") ||
    contract.includes("independant") ||
    contract.includes("prestataire") ||
    contract.includes("mission");
  
  if (isFreelance) {
    score += 10;
    scoreReasons.push("Mission freelance / prestation [+10]");
  } else if (contract.includes("cdi")) {
    score -= 20;
    scoreReasons.push("CDI classique [-20]");
  } else if (contract.includes("stage") || contract.includes("internship")) {
    score -= 20;
    scoreReasons.push("Stage / Alternance [-20]");
  }

  // 9. Talaref Compatibility
  const isTalarefCompatible = [
    "PHOTO",
    "VIDEO",
    "EVENT",
    "SOCIAL_MEDIA",
    "DESIGN",
    "PODCAST",
    "FORMATION",
  ].includes(category);
  if (isTalarefCompatible && !isCoreCategory) {
    score += 10;
    scoreReasons.push("Compétences compatibles avec l'agence [+10]");
  }

  // 10. Low relevance fallback
  if (category === "OTHER") {
    score -= 20;
    scoreReasons.push("Description peu pertinente pour l'agence [-20]");
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, score));

  // Determine priority
  let priority: "FAIBLE" | "MOYENNE" | "HAUTE" | "CRITIQUE" = "FAIBLE";
  if (finalScore >= 85 || (finalScore >= 75 && opportunity.isUrgent)) {
    priority = "CRITIQUE";
  } else if (finalScore >= 70) {
    priority = "HAUTE";
  } else if (finalScore >= 40) {
    priority = "MOYENNE";
  }

  return {
    score: finalScore,
    scoreReasons,
    priority,
  };
}
