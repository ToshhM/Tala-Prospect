import { PrismaClient, OpportunityStatus } from "@prisma/client";
import { detectCategory } from "../scoring/categorization";
import { calculateOpportunityScore } from "../scoring/scoring";
import { detectDuplicateOpportunity } from "../deduplication/deduplication";

export interface LinkedInJob {
  externalId: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  contractType: string;
  sourceUrl: string;
  publishedAt: Date;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

/**
 * Simulates scraping LinkedIn by generating highly relevant creative job postings
 * with real-world LinkedIn URL formats that redirect the user to LinkedIn.
 */
export async function fetchLinkedInJobs(keyword: string): Promise<LinkedInJob[]> {
  const normKeyword = keyword.toLowerCase();

  const allMocks: LinkedInJob[] = [
    {
      externalId: "linkedin-394012019",
      title: "Photographe de Plateau & Retoucheur Photo E-commerce",
      companyName: "Sandro / Maje / Claudie Pierlot (SMCP)",
      description: "Au sein du studio photo interne, vous assurez les prises de vues de nos collections PAP et accessoires (portés et natures mortes). Vous gérez le stylisme sur plateau, les réglages lumières, et effectuez la retouche chromatique de niveau premium sous Photoshop.",
      location: "Paris (75)",
      contractType: "CDI",
      sourceUrl: "https://www.linkedin.com/jobs/view/394012019",
      publishedAt: new Date(Date.now() - 1 * 3600 * 1000 * 24),
      contactName: "Sophie Laurent (Talent Acquisition)",
      contactEmail: "https://www.linkedin.com/in/sophie-laurent-recruitment",
      contactPhone: "01 44 55 66 77",
    },
    {
      externalId: "linkedin-395810238",
      title: "Vidéaste Réalisateur / Cadrage & Montage Vidéo (F/H)",
      companyName: "Brut.",
      description: "Brut recherche un vidéaste créatif et polyvalent pour rejoindre notre équipe de production de contenus originaux. Cadrage mobile et boîtiers hybrides (Sony FX3, Lumix GH6), montage dynamique sur Premiere Pro et sens du storytelling réseaux sociaux indispensable.",
      location: "Paris (75)",
      contractType: "CDI",
      sourceUrl: "https://www.linkedin.com/jobs/view/395810238",
      publishedAt: new Date(Date.now() - 2 * 3600 * 1000 * 24),
      contactName: "Alexandre Dubois (Lead Producer)",
      contactEmail: "https://www.linkedin.com/in/alexandre-dubois-brut",
    },
    {
      externalId: "linkedin-395123984",
      title: "Monteur Vidéo & Creative Producer Senior",
      companyName: "Konbini",
      description: "Pour nos formats phares (Fast & Curious, Club, etc.), nous recherchons un monteur vidéo expert maîtrisant Premiere Pro, After Effects et le rythme éditorial Konbini. Travail en collaboration étroite avec les journalistes.",
      location: "Paris (75)",
      contractType: "CDD / Mission",
      sourceUrl: "https://www.linkedin.com/jobs/view/395123984",
      publishedAt: new Date(Date.now() - 12 * 3600 * 1000),
      contactName: "Marie Martin (Studio Manager)",
      contactEmail: "https://www.linkedin.com/in/marie-martin-konbini",
    },
    {
      externalId: "linkedin-396821034",
      title: "Chef de Projet Événementiel & Captation Live",
      companyName: "Publicis Live",
      description: "Gestion opérationnelle et logistique de projets événementiels d'envergure. Coordination de la production technique, de la captation vidéo multi-caméras et de la diffusion en direct (live streaming). Suivi budgétaire rigoureux.",
      location: "Bordeaux (33)",
      contractType: "Freelance",
      sourceUrl: "https://www.linkedin.com/jobs/view/396821034",
      publishedAt: new Date(Date.now() - 3 * 3600 * 1000 * 24),
      contactName: "Thomas Leroy (Directeur de Production)",
      contactEmail: "https://www.linkedin.com/in/thomas-leroy-publicis-live",
    },
    {
      externalId: "linkedin-397230198",
      title: "Photographe Événementiel et Institutionnel",
      companyName: "L'Oréal",
      description: "Nous recherchons un photographe freelance pour la couverture de nos lancements de produits, conférences de presse et soirées internes corporate. Restitution rapide des photos sous 24h avec colorimétrie soignée.",
      location: "Clichy (92)",
      contractType: "Freelance / Mission",
      sourceUrl: "https://www.linkedin.com/jobs/view/397230198",
      publishedAt: new Date(Date.now() - 4 * 3600 * 1000 * 24),
      contactName: "Lucie Bernard (Communication Manager)",
      contactEmail: "https://www.linkedin.com/in/lucie-bernard-loreal-hr",
    },
    {
      externalId: "linkedin-398402913",
      title: "Développeur Front-End Creative Web (Next.js / Tailwind)",
      companyName: "Agence Locomotive",
      description: "Conception et développement de sites web vitrines immersifs et interactifs pour des marques de luxe et créatives. Animations fluides avec Framer Motion / GSAP. Intégration pixel-perfect.",
      location: "Lyon (69)",
      contractType: "CDI",
      sourceUrl: "https://www.linkedin.com/jobs/view/398402913",
      publishedAt: new Date(Date.now() - 5 * 3600 * 1000 * 24),
      contactName: "Nicolas Petit (CTO & Co-fondateur)",
      contactEmail: "https://www.linkedin.com/in/nicolas-petit-locomotive",
    },
  ];

  // Filter based on keyword search
  const filtered = allMocks.filter((mock) => {
    return (
      mock.title.toLowerCase().includes(normKeyword) ||
      mock.description.toLowerCase().includes(normKeyword) ||
      normKeyword === "photo" || normKeyword === "video" || normKeyword === "design"
    );
  });

  return filtered.length > 0 ? filtered : allMocks;
}

/**
 * Coordinates synchronization from LinkedIn to local db
 */
export async function syncLinkedInOpportunities(
  prisma: PrismaClient,
  sourceId: string
): Promise<string> {
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
    const keywordsToSearch = [
      "photographe",
      "videaste",
      "evenementiel",
      "developpeur web",
      "nextjs",
      "community manager",
      "content manager"
    ];
    const allFetchedJobs: LinkedInJob[] = [];

    for (const kw of keywordsToSearch) {
      try {
        const results = await fetchLinkedInJobs(kw);
        allFetchedJobs.push(...results);
      } catch (err) {
        console.error(`Error searching LinkedIn for '${kw}':`, err);
      }
    }

    itemsFetched = allFetchedJobs.length;

    for (const jobItem of allFetchedJobs) {
      try {
        const catInfo = detectCategory(jobItem.title, jobItem.description);
        
        // Skip OTHER posts to keep the radar focused on creative roles
        if (catInfo.category === "OTHER" && !jobItem.title.toLowerCase().includes("communication")) {
          itemsSkipped++;
          continue;
        }

        const scoring = calculateOpportunityScore({
          title: jobItem.title,
          description: jobItem.description,
          location: jobItem.location,
          publishedAt: jobItem.publishedAt,
          contractType: jobItem.contractType,
          category: catInfo.category,
        });

        // Deduplication check
        const existing = await detectDuplicateOpportunity(prisma, {
          title: jobItem.title,
          companyName: jobItem.companyName,
          source: "LINKEDIN",
          externalId: jobItem.externalId,
          location: jobItem.location,
          publishedAt: jobItem.publishedAt,
        });

        if (existing) {
           await prisma.opportunity.update({
             where: { id: existing.id },
             data: {
               score: scoring.score,
               scoreReasons: scoring.scoreReasons,
               contactName: jobItem.contactName,
               contactEmail: jobItem.contactEmail,
               contactPhone: jobItem.contactPhone,
             },
           });
           itemsUpdated++;
        } else {
          await prisma.opportunity.create({
            data: {
              title: jobItem.title,
              companyName: jobItem.companyName,
              source: "LINKEDIN",
              sourceUrl: jobItem.sourceUrl,
              externalId: jobItem.externalId,
              description: jobItem.description,
              location: jobItem.location,
              contractType: jobItem.contractType,
              category: catInfo.category,
              subCategory: catInfo.subCategory,
              keywords: catInfo.keywords,
              score: scoring.score,
              scoreReasons: scoring.scoreReasons,
              status: "DETECTED",
              publishedAt: jobItem.publishedAt,
              contactName: jobItem.contactName,
              contactEmail: jobItem.contactEmail,
              contactPhone: jobItem.contactPhone,
            },
          });
          itemsCreated++;
        }
      } catch (err) {
        console.error("Error processing specific LinkedIn offer:", err);
      }
    }

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
    console.error("Global LinkedIn sync job failed:", error);
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
