import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Compass,
  TrendingUp,
  FileCheck,
  Award,
  AlertCircle,
  Briefcase,
  ExternalLink,
  MapPin,
  Calendar,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Gather all database statistics
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Total opportunities
  const totalCount = await prisma.opportunity.count();

  // Mapped counts
  const new24hCount = await prisma.opportunity.count({
    where: { createdAt: { gte: past24h } },
  });

  const new7dCount = await prisma.opportunity.count({
    where: { createdAt: { gte: past7d } },
  });

  // Average score
  const avgScoreResult = await prisma.opportunity.aggregate({
    _avg: { score: true },
  });
  const avgScore = avgScoreResult._avg.score ? Math.round(avgScoreResult._avg.score) : 0;

  // Pipeline counts
  const pipelineStats = await prisma.opportunity.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const statusMap = pipelineStats.reduce((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {} as Record<string, number>);

  const activeStages = [
    { label: "À qualifier", key: "TO_QUALIFY", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { label: "À contacter", key: "TO_CONTACT", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { label: "Contacté", key: "CONTACTED", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { label: "Relances", key: "FOLLOW_UP", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    { label: "RDV / Devis", key: "QUOTE_SENT", color: "bg-pink-500/10 text-pink-500 border-pink-500/20" },
    { label: "Gagné", key: "WON", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  ];

  // Top high priority opportunities (Score >= 70)
  const topOpportunities = await prisma.opportunity.findMany({
    where: {
      status: {
        in: ["DETECTED", "TO_QUALIFY", "TO_CONTACT"],
      },
      score: { gte: 60 },
    },
    orderBy: [
      { score: "desc" },
      { publishedAt: "desc" },
    ],
    take: 5,
  });

  // Category counts
  const categoryStats = await prisma.opportunity.groupBy({
    by: ["category"],
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
    take: 4,
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Commercial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse en temps réel de votre radar d'opportunités Talaref.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/explorer"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            <Compass className="h-4 w-4" />
            Explorer les opportunités
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total radar */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Radar</p>
            <p className="text-3xl font-bold text-foreground">{totalCount}</p>
            <p className="text-[10px] text-muted-foreground">Opportunités détectées</p>
          </div>
          <div className="p-3 bg-muted border border-border rounded-lg text-muted-foreground">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        {/* Mapped 24h */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dernières 24h</p>
            <p className="text-3xl font-bold text-foreground">+{new24hCount}</p>
            <p className="text-[10px] text-emerald-500">+{new7dCount} sur 7 jours</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Avg score */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score moyen</p>
            <p className="text-3xl font-bold text-foreground">{avgScore}%</p>
            <p className="text-[10px] text-muted-foreground">Pertinence Talaref</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* To qualify */}
        <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À qualifier</p>
            <p className="text-3xl font-bold text-foreground">
              {statusMap["TO_QUALIFY"] || 0}
            </p>
            <p className="text-[10px] text-muted-foreground">Missions en attente de validation</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid: Pipeline stages & Category breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline Stages progress bar */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Pipeline de Qualification</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {activeStages.map((stage) => {
              const count = statusMap[stage.key] || 0;
              return (
                <div
                  key={stage.key}
                  className={`rounded-lg border p-3 flex flex-col items-center justify-center text-center ${stage.color}`}
                >
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-[10px] font-semibold mt-1 truncate w-full">
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Top Métiers Détectés</h2>
          <div className="space-y-3">
            {categoryStats.map((cat) => {
              const pct = totalCount > 0 ? Math.round((cat._count._all / totalCount) * 100) : 0;
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground/80">{cat.category}</span>
                    <span className="text-muted-foreground">{cat._count._all} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {categoryStats.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom section: Top Recommendations */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Recommandations Prioritaires</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                <th className="py-3 px-4">Opportunité</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {topOpportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-4 px-4 font-semibold text-foreground">
                    <div className="flex flex-col">
                      <span>{opp.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">{opp.companyName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                      {opp.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {opp.location}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-xs uppercase">{opp.source}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-block w-8 py-0.5 rounded text-xs font-bold ${
                      opp.score >= 80
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : opp.score >= 50
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {opp.score}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-3">
                      {opp.sourceUrl && (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                          title="Voir l'annonce d'origine"
                        >
                          Offre
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-400"
                      >
                        Qualifier &rarr;
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {topOpportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    Aucune opportunité prioritaire détectée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
