import { PrismaClient } from "@prisma/client";
import { detectCategory } from "../scoring/categorization";
import { calculateOpportunityScore } from "../scoring/scoring";
import { detectDuplicateOpportunity } from "../deduplication/deduplication";

interface FranceTravailTokenResponse {
  access_token: string;
  expires_in: number;
}

interface FranceTravailSearchResponse {
  resultats: any[];
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Negotiates OAuth2 credentials to get a temporary access token from France Travail
 */
export async function getAccessToken(): Promise<string> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("FRANCE_TRAVAIL_CLIENT_ID or CLIENT_SECRET is not configured.");
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "api_offresdemploiv2 o2dsoffre");

  const response = await fetch(
    "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch France Travail access token: ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as FranceTravailTokenResponse;
  cachedToken = data.access_token;
  // Expire 1 minute early to avoid edge cases
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return cachedToken;
}

/**
 * Normalizes France Travail raw offer model to our internal schema format
 */
export function normalizeFranceTravailOpportunity(raw: any) {
  const location = raw.lieuTravail
    ? `${raw.lieuTravail.libelle || ""} ${raw.lieuTravail.codePostal || ""}`.trim()
    : "France";

  const contractType = raw.typeContrat || "Autre";
  
  // Parse budget or salary from France Travail format
  let salaryMin: number | null = null;
  let salaryMax: number | null = null;
  if (raw.salaire) {
    if (typeof raw.salaire.min === "number") salaryMin = raw.salaire.min;
    if (typeof raw.salaire.max === "number") salaryMax = raw.salaire.max;
    // fallback parsing from commentaire/libelle
    const text = (raw.salaire.libelle || raw.salaire.commentaire || "").toLowerCase();
    const match = text.match(/(\d+[\s\d]*)\s*€/);
    if (match && !salaryMin) {
      const parsed = parseFloat(match[1].replace(/\s/g, ""));
      salaryMin = parsed;
      salaryMax = parsed;
    }
  }

  const isDirect = raw.origineOffre?.origine === "1"; // "1" indicates Pôle Emploi direct customer

  return {
    title: raw.intitule || "Sans titre",
    companyName: raw.entreprise?.nom || "Entreprise Anonyme",
    source: "FRANCE_TRAVAIL",
    sourceUrl: raw.origineOffre?.urlOrigine || null,
    externalId: raw.id,
    description: raw.description || "Aucune description fournie.",
    shortDescription: raw.description ? raw.description.substring(0, 200) + "..." : null,
    location,
    city: raw.lieuTravail?.libelle || null,
    region: null,
    country: "France",
    remoteType: raw.deplacementCode === "N" ? "FULL_REMOTE" : "ON_SITE",
    contractType,
    employmentType: raw.dureeTravailLibelle || null,
    budgetMin: null,
    budgetMax: null,
    salaryMin,
    salaryMax,
    currency: "EUR",
    publishedAt: raw.dateCreation ? new Date(raw.dateCreation) : new Date(),
    expiresAt: raw.dateExpiration ? new Date(raw.dateExpiration) : null,
    contactName: raw.contact?.nom || null,
    contactEmail: raw.contact?.courriel || null,
    contactPhone: raw.contact?.telephone || null,
    isDirectClient: isDirect,
    isUrgent: raw.dureeTravailLibelle?.toLowerCase().includes("urgent") || false,
    isRemote: raw.deplacementCode === "N",
  };
}

/**
 * Perform a query search on France Travail API
 */
export async function searchOpportunities(
  keywords: string,
  rangeStart = 0,
  rangeEnd = 149
): Promise<any[]> {
  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  if (!clientId) {
    // Return high quality mock data in development when credentials are not configured
    return getMockOpportunities(keywords);
  }

  const token = await getAccessToken();
  const url = `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?motsCles=${encodeURIComponent(
    keywords
  )}&range=${rangeStart}-${rangeEnd}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  // Handle Rate Limiting (HTTP 429)
  if (response.status === 429) {
    console.warn("France Travail API: Rate limit hit. Waiting 2 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return searchOpportunities(keywords, rangeStart, rangeEnd);
  }

  if (response.status === 204) {
    return []; // No content
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`France Travail API error: ${response.statusText} - ${text}`);
  }

  const data = (await response.json()) as FranceTravailSearchResponse;
  return data.resultats || [];
}

/**
 * Coordinates synchronization from France Travail to local db
 */
export async function syncFranceTravailOpportunities(
  prisma: PrismaClient,
  sourceId: string
): Promise<string> {
  // Create a SyncJob record
  const job = await prisma.syncJob.create({
    data: {
      sourceId,
      status: "RUNNING",
    },
  });

  let itemsFetched = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;

  try {
    // Sync for our key agency keywords: Photo, Video, Web/NextJS, and Digital Management
    const keywordsToSearch = [
      "photographe",
      "videaste",
      "evenementiel",
      "developpeur web",
      "nextjs",
      "community manager",
      "content manager"
    ];
    const allFetchedOffers: any[] = [];

    for (const kw of keywordsToSearch) {
      try {
        const results = await searchOpportunities(kw);
        allFetchedOffers.push(...results);
      } catch (err) {
        console.error(`Error searching keywords '${kw}' in FT:`, err);
      }
    }

    itemsFetched = allFetchedOffers.length;

    // Process and normalize
    for (const rawOffer of allFetchedOffers) {
      try {
        const normalized = normalizeFranceTravailOpportunity(rawOffer);
        const catInfo = detectCategory(normalized.title, normalized.description);
        
        // Skip completely irrelevant OTHER posts to keep radar focused
        if (catInfo.category === "OTHER" && !normalized.title.toLowerCase().includes("communication")) {
          itemsSkipped++;
          continue;
        }

        const scoring = calculateOpportunityScore({
          ...normalized,
          category: catInfo.category,
        });

        // Deduplication check
        const existing = await detectDuplicateOpportunity(prisma, {
          title: normalized.title,
          companyName: normalized.companyName,
          source: normalized.source,
          externalId: normalized.externalId,
          location: normalized.location,
          publishedAt: normalized.publishedAt,
        });

        if (existing) {
          // If already exists, update score/reasons just in case, but keep CRM status intact
          await prisma.opportunity.update({
            where: { id: existing.id },
            data: {
              score: scoring.score,
              scoreReasons: scoring.scoreReasons,
            },
          });
          itemsUpdated++;
        } else {
          // Create new opportunity
          await prisma.opportunity.create({
            data: {
              ...normalized,
              category: catInfo.category,
              subCategory: catInfo.subCategory,
              keywords: catInfo.keywords,
              score: scoring.score,
              scoreReasons: scoring.scoreReasons,
              status: "DETECTED",
            },
          });
          itemsCreated++;
        }
      } catch (err) {
        console.error("Error processing specific France Travail offer:", err);
      }
    }

    // Success update
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        itemsFetched,
        itemsCreated,
        itemsUpdated,
        itemsSkipped,
      },
    });

    await prisma.source.update({
      where: { id: sourceId },
      data: { lastSyncAt: new Date() },
    });

    return `Sync completed: ${itemsCreated} created, ${itemsUpdated} updated, ${itemsSkipped} skipped.`;
  } catch (error: any) {
    console.error("Global France Travail sync job failed:", error);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: error.message || String(error),
      },
    });
    throw error;
  }
}

/**
 * Returns premium realistic mock data for local testing when no API key is specified
 */
function getMockOpportunities(keyword: string): any[] {
  const keywordClean = keyword.toLowerCase();
  
  const mockBase = [
    {
      id: "ft-mock-1",
      intitule: "Photographe de studio corporate H/F",
      description: "Nous recherchons un photographe freelance expérimenté pour réaliser les portraits professionnels (trombinoscope) de notre équipe de direction à Paris. Mission de 2 jours. Matériel studio requis.",
      dateCreation: new Date().toISOString(),
      lieuTravail: { libelle: "Paris 8e", codePostal: "75008" },
      entreprise: { nom: "Talent Solutions SA" },
      origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/1", origine: "1" },
      typeContrat: "Freelance",
      salaire: { libelle: "2500 € pour la mission", min: 2500, max: 2500 },
      contact: { nom: "Sophie Martin", courriel: "s.martin@talentsolutions.fr", telephone: "0601020304" },
      deplacementCode: "N",
    },
    {
      id: "ft-mock-2",
      intitule: "Vidéaste pour captation événementielle - Aftermovie",
      description: "Pour notre festival annuel en Seine-et-Marne, recherche cadreur/monteur pour réaliser une captation vidéo complète et un aftermovie rythmé de 2 minutes. Urgent, événement prévu ce week-end !",
      dateCreation: new Date(Date.now() - 4 * 3600000).toISOString(), // 4h ago
      lieuTravail: { libelle: "Marne-la-Vallée", codePostal: "77700" },
      entreprise: { nom: "Festival Pop Sound" },
      origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/2", origine: "2" },
      typeContrat: "Freelance / CDD",
      salaire: { libelle: "1200 € par jour", min: 1200, max: 1200 },
      contact: { nom: "Antoine Laurent", courriel: "contact@popsound.com" },
      deplacementCode: "N",
      dureeTravailLibelle: "Urgent",
    },
    {
      id: "ft-mock-3",
      intitule: "Développeur React/Next.js Full-Stack Freelance H/F",
      description: "Agence digitale recherche un développeur expérimenté sur Next.js et Prisma pour finaliser le portail client d'une grande marque. Démarrage ASAP, télétravail complet possible.",
      dateCreation: new Date().toISOString(),
      lieuTravail: { libelle: "Lyon 2e", codePostal: "69002" },
      entreprise: { nom: "NextGen Digital" },
      origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/3", origine: "1" },
      typeContrat: "Freelance",
      salaire: { libelle: "450 € / jour", min: 450, max: 450 },
      deplacementCode: "N",
    },
    {
      id: "ft-mock-4",
      intitule: "Stage Assistant Monteur Vidéo & Graphisme",
      description: "Recherche un stagiaire curieux et passionné de montage vidéo sur Premiere Pro et After Effects. Durée 6 mois. Rémunération légale.",
      dateCreation: new Date(Date.now() - 10 * 24 * 3600000).toISOString(), // 10 days ago
      lieuTravail: { libelle: "Paris 11e", codePostal: "75011" },
      entreprise: { nom: "Studio Creative Prod" },
      origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/4", origine: "1" },
      typeContrat: "Stage",
      salaire: { libelle: "650 € par mois", min: 650, max: 650 },
      deplacementCode: "N",
    },
    {
      id: "ft-mock-5",
      intitule: "Concepteur Rédacteur Web / CM H/F",
      description: "Rattaché au pôle marketing, vous écrirez les newsletters hebdomadaires et animerez les réseaux sociaux Instagram et LinkedIn d'une start-up de cosmétiques bio à Paris.",
      dateCreation: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
      lieuTravail: { libelle: "Paris 10e", codePostal: "75010" },
      entreprise: { nom: "CosmeBio Group" },
      origineOffre: { urlOrigine: "https://candidat.francetravail.fr/offres/5", origine: "1" },
      typeContrat: "CDI",
      salaire: { libelle: "32000 € / an", min: 2600, max: 2800 },
      deplacementCode: "N",
    },
  ];

  // Simple filter by match
  return mockBase.filter(
    (item) =>
      item.intitule.toLowerCase().includes(keywordClean) ||
      item.description.toLowerCase().includes(keywordClean)
  );
}
