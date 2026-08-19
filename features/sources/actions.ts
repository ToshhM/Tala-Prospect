"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { syncFranceTravailOpportunities } from "@/services/france-travail/france-travail";
import { detectCategory } from "@/services/scoring/categorization";
import { calculateOpportunityScore } from "@/services/scoring/scoring";

/**
 * Ensures user is authenticated and returns their session profile
 */
async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Non autorisé. Veuillez vous connecter.");
  }
  return session;
}

/**
 * Triggers France Travail API Synchronization
 */
export async function triggerFranceTravailSync() {
  await getAuthSession();

  // Find France Travail Source ID
  const source = await prisma.source.findUnique({
    where: { id: "france-travail-api-source" },
  });

  if (!source) {
    throw new Error("Source France Travail introuvable.");
  }

  // Trigger sync in background (or block and return result)
  const result = await syncFranceTravailOpportunities(prisma, source.id);
  
  revalidatePath("/sources");
  revalidatePath("/explorer");
  revalidatePath("/");
  
  return result;
}

/**
 * Manually adds an opportunity to the database, auto-calculating score and categories
 */
export async function createManualOpportunity(formData: FormData) {
  const session = await getAuthSession();
  const userId = (session.user as any).id;

  const title = formData.get("title") as string;
  const companyName = formData.get("companyName") as string;
  const sourceUrl = (formData.get("sourceUrl") as string) || null;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const budgetText = formData.get("budgetMax") as string;
  const contactName = (formData.get("contactName") as string) || null;
  const contactEmail = (formData.get("contactEmail") as string) || null;
  const contactPhone = (formData.get("contactPhone") as string) || null;

  if (!title || !companyName || !description || !location) {
    throw new Error("Les champs Titre, Entreprise, Description et Localisation sont requis.");
  }

  // Parse budget
  const budgetMax = budgetText ? parseFloat(budgetText) : null;

  // Run categorization engine
  const catInfo = detectCategory(title, description);

  // Run scoring engine
  const scoring = calculateOpportunityScore({
    title,
    description,
    location,
    publishedAt: new Date(),
    contractType: "Freelance", // Default for manual imports usually
    budgetMax,
    isDirectClient: true, // Manual imports are typically direct leads
    isUrgent: false,
    contactName,
    contactEmail,
    contactPhone,
    category: catInfo.category,
  });

  // Generate unique external ID for manual opportunity
  const externalId = `manual-${Date.now()}`;

  const opportunity = await prisma.opportunity.create({
    data: {
      title,
      companyName,
      source: "MANUAL",
      sourceUrl,
      externalId,
      description,
      shortDescription: description.substring(0, 200) + "...",
      location,
      budgetMax,
      publishedAt: new Date(),
      contactName,
      contactEmail,
      contactPhone,
      category: catInfo.category,
      subCategory: catInfo.subCategory,
      keywords: catInfo.keywords,
      score: scoring.score,
      scoreReasons: scoring.scoreReasons,
      isDirectClient: true,
      status: "TO_QUALIFY",
    },
  });

  // Log action
  await prisma.opportunityAction.create({
    data: {
      opportunityId: opportunity.id,
      userId,
      type: "STATUS_CHANGE",
      details: "Opportunité ajoutée manuellement par l'équipe",
    },
  });

  revalidatePath("/explorer");
  revalidatePath("/pipeline");
  revalidatePath("/");

  return opportunity;
}
