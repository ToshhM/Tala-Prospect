import { PrismaClient, Opportunity } from "@prisma/client";

export interface DuplicateCheckInput {
  title: string;
  companyName: string;
  source: string;
  externalId?: string | null;
  location: string;
  publishedAt: Date;
}

/**
 * Normalizes a string by converting it to lowercase and removing special characters/spaces
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Checks if two strings are highly similar using a simple normalized character match
 */
function isSimilar(str1: string, str2: string): boolean {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  if (!norm1 || !norm2) return false;
  return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1);
}

/**
 * Detects if an opportunity is a duplicate of an existing one in the database.
 * Returns the matching Opportunity if found, or null if no duplicate.
 */
export async function detectDuplicateOpportunity(
  prisma: PrismaClient,
  input: DuplicateCheckInput
): Promise<Opportunity | null> {
  // 1. Exact Match Check (externalId + source)
  if (input.externalId) {
    const exactMatch = await prisma.opportunity.findUnique({
      where: {
        source_externalId: {
          source: input.source,
          externalId: input.externalId,
        },
      },
    });
    if (exactMatch) {
      return exactMatch;
    }
  }

  // 2. Similarity Check Fallback
  // Look for opportunities from the same company published within +/- 3 days
  const timeToleranceMs = 3 * 24 * 60 * 60 * 1000; // 3 days
  const publishedTime = new Date(input.publishedAt).getTime();
  const startDate = new Date(publishedTime - timeToleranceMs);
  const endDate = new Date(publishedTime + timeToleranceMs);

  const potentialDuplicates = await prisma.opportunity.findMany({
    where: {
      companyName: {
        mode: "insensitive",
        equals: input.companyName,
      },
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  for (const opp of potentialDuplicates) {
    // Compare normalized title
    if (isSimilar(opp.title, input.title)) {
      // Compare location
      if (isSimilar(opp.location, input.location)) {
        return opp;
      }
    }
  }

  return null;
}
