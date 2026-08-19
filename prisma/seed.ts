import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create Default Users with hashed passwords
  const passwordHash = await bcrypt.hash("talaref2026", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "cto@talaref.com" },
    update: {},
    create: {
      email: "cto@talaref.com",
      name: "CTO Talaref",
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: "commercial@talaref.com" },
    update: {},
    create: {
      email: "commercial@talaref.com",
      name: "Jean Commercial",
      role: "MEMBER",
      passwordHash,
    },
  });

  console.log("Users created:", { superAdmin: superAdmin.email, memberUser: memberUser.email });

  // 2. Create Sources
  const ftSource = await prisma.source.upsert({
    where: { id: "france-travail-api-source" },
    update: {},
    create: {
      id: "france-travail-api-source",
      name: "France Travail API",
      type: "API",
      isActive: true,
      config: JSON.stringify({ keywords: ["photographe", "videaste"] }),
    },
  });

  const manualSource = await prisma.source.upsert({
    where: { id: "manual-source" },
    update: {},
    create: {
      id: "manual-source",
      name: "Import Manuel",
      type: "MANUAL",
      isActive: true,
    },
  });

  const helloworkSource = await prisma.source.upsert({
    where: { id: "hellowork-source" },
    update: {},
    create: {
      id: "hellowork-source",
      name: "HelloWork Scraper",
      type: "RSS",
      isActive: true,
      config: JSON.stringify({ keywords: ["photographe", "videaste"] }),
    },
  });

  const linkedinSource = await prisma.source.upsert({
    where: { id: "linkedin-source" },
    update: {},
    create: {
      id: "linkedin-source",
      name: "LinkedIn Radar",
      type: "OTHER",
      isActive: true,
    },
  });

  const wttjSource = await prisma.source.upsert({
    where: { id: "wttj-source" },
    update: {},
    create: {
      id: "wttj-source",
      name: "Welcome to the Jungle",
      type: "OTHER",
      isActive: true,
    },
  });

  const indeedSource = await prisma.source.upsert({
    where: { id: "indeed-source" },
    update: {},
    create: {
      id: "indeed-source",
      name: "Indeed Scraper",
      type: "OTHER",
      isActive: true,
    },
  });

  const facebookSource = await prisma.source.upsert({
    where: { id: "facebook-source" },
    update: {},
    create: {
      id: "facebook-source",
      name: "Facebook Jobs",
      type: "OTHER",
      isActive: true,
    },
  });

  const glassdoorSource = await prisma.source.upsert({
    where: { id: "glassdoor-source" },
    update: {},
    create: {
      id: "glassdoor-source",
      name: "Glassdoor Scraper",
      type: "OTHER",
      isActive: true,
    },
  });

  console.log("Sources created:", {
    ftSource: ftSource.name,
    manualSource: manualSource.name,
    helloworkSource: helloworkSource.name,
    linkedinSource: linkedinSource.name,
    wttjSource: wttjSource.name,
    indeedSource: indeedSource.name,
    facebookSource: facebookSource.name,
    glassdoorSource: glassdoorSource.name,
  });

  // 3. Create Sample Opportunities
  const now = new Date();
  
  const opportunities = [
    {
      title: "Shooting Photo Mode - Collection d'Hiver",
      companyName: "Moda Paris",
      source: "MANUAL",
      sourceUrl: "https://modaparis.com/careers/shoot-winter",
      externalId: "manual-shoot-winter",
      description: "Nous recherchons un photographe de mode professionnel pour réaliser le shooting de notre nouvelle collection d'hiver. 3 jours de shooting en studio à Paris. Retouches incluses. Budget élevé.",
      shortDescription: "Shooting de mode professionnel en studio à Paris pour collection d'hiver.",
      location: "Paris 10e",
      city: "Paris",
      country: "France",
      remoteType: "ON_SITE",
      contractType: "Freelance",
      budgetMin: 3500,
      budgetMax: 5000,
      currency: "EUR",
      publishedAt: new Date(now.getTime() - 24 * 3600000), // 1 day ago
      contactName: "Claire Dubois",
      contactEmail: "c.dubois@modaparis.com",
      contactPhone: "0142345678",
      category: "PHOTO",
      subCategory: "mode",
      keywords: ["photographe", "shooting", "photo", "studio", "mode"],
      isDirectClient: true,
      isUrgent: false,
      isRemote: false,
      score: 95,
      scoreReasons: [
        "Budget élevé (>= 2000 €) [+30]",
        "Localisé à Paris / Île-de-France [+20]",
        "Métier cœur Talaref (PHOTO) [+20]",
        "Contact direct disponible [+15]",
        "Publiée il y a moins de 48h [+10]",
        "Client direct [+10]",
        "Mission freelance / prestation [+10]"
      ],
      status: "DETECTED" as const,
    },
    {
      title: "Vidéaste cadreur/monteur pour aftermovie événementiel",
      companyName: "TechCorp Europe",
      source: "FRANCE_TRAVAIL",
      sourceUrl: "https://candidat.francetravail.fr/offres/123video",
      externalId: "123video",
      description: "Recherche un vidéaste freelance pour la captation vidéo et la réalisation de l'aftermovie officiel de notre conférence annuelle à Paris. Matériel de captation et montage requis sous 48h.",
      shortDescription: "Réalisation de l'aftermovie officiel pour notre conférence annuelle à Paris.",
      location: "Paris 15e",
      city: "Paris",
      country: "France",
      remoteType: "ON_SITE",
      contractType: "Freelance",
      budgetMin: 1500,
      budgetMax: 2000,
      currency: "EUR",
      publishedAt: new Date(now.getTime() - 4 * 3600000), // 4 hours ago
      contactName: "Marc Lemaire",
      contactEmail: "m.lemaire@techcorp.com",
      category: "VIDEO",
      subCategory: "aftermovie",
      keywords: ["vidéaste", "captation", "aftermovie", "montage"],
      isDirectClient: true,
      isUrgent: true,
      isRemote: false,
      score: 95,
      scoreReasons: [
        "Budget élevé (>= 2000 €) [+30]",
        "Localisé à Paris / Île-de-France [+20]",
        "Métier cœur Talaref (VIDEO) [+20]",
        "Contact direct disponible [+15]",
        "Publiée il y a moins de 48h [+10]",
        "Client direct [+10]",
        "Urgence détectée [+10]",
        "Mission freelance / prestation [+10]"
      ],
      status: "TO_QUALIFY" as const,
    },
    {
      title: "Création de site web vitrine & identité visuelle",
      companyName: "Cabinet Dupin Avocats",
      source: "MANUAL",
      sourceUrl: "https://dupin-avocats.fr",
      externalId: "manual-dupin-web",
      description: "Pour la création de notre nouveau cabinet, nous cherchons une agence ou un freelance pour concevoir notre identité de marque (logo, charte graphique) et notre site web vitrine responsive sous WordPress.",
      shortDescription: "Identité de marque et site web vitrine sous WordPress pour un cabinet d'avocats.",
      location: "Versailles",
      city: "Versailles",
      country: "France",
      remoteType: "HYBRID",
      contractType: "Freelance",
      budgetMin: 2500,
      budgetMax: 3500,
      currency: "EUR",
      publishedAt: new Date(now.getTime() - 3 * 24 * 3600000), // 3 days ago
      contactName: "Arthur Dupin",
      contactEmail: "contact@dupin-avocats.fr",
      category: "WEB",
      subCategory: null,
      keywords: ["développeur", "dev", "site web", "wordpress", "logo", "branding"],
      isDirectClient: true,
      isUrgent: false,
      isRemote: false,
      score: 75,
      scoreReasons: [
        "Budget élevé (>= 2000 €) [+30]",
        "Localisé à Paris / Île-de-France [+20]",
        "Contact direct disponible [+15]",
        "Client direct [+10]",
        "Mission freelance / prestation [+10]",
        "Compétences compatibles avec l'agence [+10]"
      ],
      status: "TO_CONTACT" as const,
    },
    {
      title: "Chef de projet social media & influence",
      companyName: "Cosmetics Beauty",
      source: "FRANCE_TRAVAIL",
      sourceUrl: "https://candidat.francetravail.fr/offres/456cosmetics",
      externalId: "456cosmetics",
      description: "Recherche un collaborateur pour animer nos réseaux sociaux et gérer nos campagnes d'influence sur TikTok et Instagram. Poste en CDI classique basé à Lyon.",
      shortDescription: "Gestion de l'animation des réseaux sociaux et influence à Lyon en CDI.",
      location: "Lyon",
      city: "Lyon",
      country: "France",
      remoteType: "ON_SITE",
      contractType: "CDI",
      salaryMin: 32000,
      salaryMax: 36000,
      currency: "EUR",
      publishedAt: new Date(now.getTime() - 8 * 24 * 3600000), // 8 days ago
      category: "SOCIAL_MEDIA",
      subCategory: null,
      keywords: ["social media", "instagram", "tiktok", "influence"],
      isDirectClient: false,
      isUrgent: false,
      isRemote: false,
      score: 0,
      scoreReasons: [
        "CDI classique [-20]",
        "Compétences compatibles avec l'agence [+10]"
      ],
      status: "LOST" as const,
    },
  ];

  for (const opp of opportunities) {
    await prisma.opportunity.upsert({
      where: {
        source_externalId: {
          source: opp.source,
          externalId: opp.externalId,
        },
      },
      update: {},
      create: opp,
    });
  }

  console.log("Mock opportunities created!");
  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
