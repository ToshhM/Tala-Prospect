export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  PHOTO: [
    "photographe",
    "shooting",
    "photo",
    "portrait",
    "studio photo",
    "book photo",
    "reportage photo",
    "corporate photo",
    "packshot",
  ],
  VIDEO: [
    "vidéaste",
    "video",
    "vidéo",
    "captation",
    "after movie",
    "aftermovie",
    "réalisateur",
    "monteur",
    "tournage",
    "montage",
    "film",
    "réalisation",
    "cadreur",
    "motion design",
    "youtube",
  ],
  EVENT: [
    "événement",
    "evenement",
    "event",
    "salon",
    "festival",
    "conférence",
    "conference",
    "soirée",
    "soiree",
    "concert",
    "séminaire",
    "seminaire",
    "foire",
    "lancement",
  ],
  SOCIAL_MEDIA: [
    "social media",
    "réseaux sociaux",
    "reseaux sociaux",
    "instagram",
    "tiktok",
    "community manager",
    "cm",
    "content manager",
    "planning éditorial",
  ],
  DESIGN: [
    "graphiste",
    "designer",
    "logo",
    "branding",
    "webdesign",
    "illustration",
    "ui/ux",
    "maquette",
    "créatif",
    "direction artistique",
  ],
  WEB: [
    "développeur",
    "developpeur",
    "dev",
    "frontend",
    "backend",
    "fullstack",
    "site web",
    "react",
    "next.js",
    "wordpress",
    "shopify",
    "application",
    "javascript",
    "digital",
  ],
  PODCAST: [
    "podcast",
    "audio",
    "enregistrement",
    "voix off",
    "voix-off",
    "studio son",
    "montage audio",
    "sound design",
  ],
  FORMATION: [
    "formation",
    "formateur",
    "cours",
    "workshop",
    "atelier",
    "enseigner",
    "sensibilisation",
  ],
  COMMERCIAL: [
    "commercial",
    "sales",
    "business developer",
    "bizdev",
    "prospection",
    "vente",
    "négociateur",
  ],
  MARKETING: [
    "marketing",
    "growth",
    "seo",
    "sea",
    "ads",
    "acquisition",
    "google ads",
    "facebook ads",
    "newsletter",
  ],
  COMMUNICATION: [
    "communication",
    "relations presse",
    "rp",
    "rédacteur",
    "redacteur",
    "rédaction",
    "presse",
    "média",
  ],
  INFLUENCE: [
    "influenceur",
    "influence",
    "créateur de contenu",
    "talent",
    "influenceurs",
    "partenariat marque",
  ],
};

export const SUBCATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  VIDEO: {
    tournage: ["tournage", "filmer", "cadreur", "plateau"],
    montage: ["montage", "monteur", "editing", "post-production"],
    realisation: ["réalisation", "realisation", "réalisateur", "realisateur"],
    aftermovie: ["aftermovie", "after movie", "récapitulatif", "recap"],
    captation: ["captation", "live", "direct", "enregistrement live"],
    interview: ["interview", "témoignage", "micro-trottoir"],
    publicite: ["publicité", "publicite", "pub", "spot", "promo"],
  },
  PHOTO: {
    shooting: ["shooting", "séance photo", "seance photo"],
    corporate: ["corporate", "portrait pro", "trombinoscope", "bureau"],
    evenementiel: ["événementiel", "evenementiel", "soirée", "conférence"],
    immobilier: ["immobilier", "architecture", "appartement", "maison"],
    mode: ["mode", "lookbook", "shooting mode", "mannequin"],
    produit: ["produit", "packshot", "e-commerce", "studio"],
  },
};

export interface CategorizationResult {
  category: string;
  subCategory: string | null;
  keywords: string[];
}

export function detectCategory(title: string, description: string): CategorizationResult {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const categoryScores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};

  // Check categories
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    matchedKeywords[category] = [];
    let score = 0;
    
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        // Higher weight if keyword is in the title
        const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
        score += inTitle ? 5 : 1;
        matchedKeywords[category].push(keyword);
      }
    }
    
    if (score > 0) {
      categoryScores[category] = score;
    }
  }

  // Find the category with the highest score
  let detectedCategory = "OTHER";
  let maxScore = 0;
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedCategory = category;
    }
  }

  // Find sub-category if applicable (e.g. for PHOTO or VIDEO)
  let detectedSubCategory: string | null = null;
  if (SUBCATEGORY_KEYWORDS[detectedCategory]) {
    let maxSubScore = 0;
    for (const [subCat, keywords] of Object.entries(SUBCATEGORY_KEYWORDS[detectedCategory])) {
      let subScore = 0;
      for (const keyword of keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          const inTitle = title.toLowerCase().includes(keyword.toLowerCase());
          subScore += inTitle ? 3 : 1;
        }
      }
      if (subScore > maxSubScore) {
        maxSubScore = subScore;
        detectedSubCategory = subCat;
      }
    }
  }

  return {
    category: detectedCategory,
    subCategory: detectedSubCategory,
    keywords: matchedKeywords[detectedCategory] || [],
  };
}
