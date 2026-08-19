import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFranceTravailOpportunities } from "@/services/france-travail/france-travail";
import { syncHelloWorkOpportunities, syncMockSourceOpportunities } from "@/services/hellowork/hellowork";
import { syncLinkedInOpportunities } from "@/services/linkedin/linkedin";

/**
 * Automated cron sync endpoint — called every 6 hours by Vercel Cron.
 * Synchronizes all active sources in sequence.
 *
 * Schedule: every 6 hours (00:00, 06:00, 12:00, 18:00 UTC) — see vercel.json
 * Security: validates Authorization header with CRON_SECRET env variable
 */
export async function GET(request: NextRequest) {
  // Security check — Vercel Cron sends the secret automatically
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  console.log(`[Cron] Starting full sync at ${startedAt.toISOString()}`);

  // Fetch all active sources from DB
  const sources = await prisma.source.findMany({
    where: { isActive: true },
  });

  for (const source of sources) {
    try {
      let result = "";

      if (source.id === "france-travail-api-source") {
        result = await syncFranceTravailOpportunities(prisma, source.id);
      } else if (source.id === "hellowork-source") {
        result = await syncHelloWorkOpportunities(prisma, source.id);
      } else if (source.id === "linkedin-source") {
        result = await syncLinkedInOpportunities(prisma, source.id);
      } else if (source.id !== "manual-source") {
        // WTTJ, Indeed, Facebook, Glassdoor → mock sync
        result = await syncMockSourceOpportunities(prisma, source.id, source.name);
      }

      if (result) {
        results[source.name] = result;
        console.log(`[Cron] ✅ ${source.name}: ${result}`);
      }
    } catch (err: any) {
      errors[source.name] = err.message || String(err);
      console.error(`[Cron] ❌ ${source.name} failed:`, err);
    }
  }

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  console.log(`[Cron] Full sync completed in ${durationMs}ms`);

  return NextResponse.json({
    success: true,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    results,
    errors,
  });
}
