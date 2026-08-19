import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield, ShieldAlert, Users, Database, AlertCircle, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white">Accès Refusé</h2>
        <p className="text-zinc-500 text-xs mt-1 max-w-sm">
          Vous n'avez pas les privilèges suffisants pour accéder à la configuration d'administration de TalaProspect.
        </p>
      </div>
    );
  }

  // Gather Admin Metrics
  const totalUsers = await prisma.user.count();
  const totalOpps = await prisma.opportunity.count();
  const totalSources = await prisma.source.count();
  const totalJobs = await prisma.syncJob.count();
  
  const failedJobsCount = await prisma.syncJob.count({
    where: { status: "FAILED" },
  });

  const wonOppsCount = await prisma.opportunity.count({
    where: { status: "WON" },
  });

  // Calculate estimated total won pipeline value
  const wonPipelineValueResult = await prisma.opportunity.aggregate({
    _sum: { budgetMax: true },
    where: { status: "WON" },
  });
  const wonPipelineValue = wonPipelineValueResult._sum.budgetMax || 0;

  // Recent Failed Jobs to debug API sync errors
  const failedJobs = await prisma.syncJob.findMany({
    where: { status: "FAILED" },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: {
      source: { select: { name: true } },
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Configuration Admin</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Supervisez la base de données, suivez les incidents de synchronisation et auditez les performances.
            </p>
          </div>
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilisateurs</span>
            <Users className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
        </div>

        {/* Total Opportunities */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Opportunités</span>
            <Database className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold text-white">{totalOpps}</p>
        </div>

        {/* Won opportunities */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Missions Gagnées</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {wonOppsCount}
          </p>
        </div>

        {/* Sync failures */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Sync Failures</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className={`text-2xl font-bold ${failedJobsCount > 0 ? "text-red-500" : "text-white"}`}>
            {failedJobsCount} / {totalJobs}
          </p>
        </div>
      </div>

      {/* Grid: Database Status & Error Log */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* DB Metrics */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Performances Pipeline</h2>
          <div className="space-y-4 text-xs">
            <div className="flex justify-between border-b border-zinc-850 pb-2.5">
              <span className="text-zinc-500">Chiffre d'Affaires Gagné (Won):</span>
              <span className="font-bold text-white">{wonPipelineValue.toLocaleString("fr-FR")} €</span>
            </div>
            <div className="flex justify-between border-b border-zinc-850 pb-2.5">
              <span className="text-zinc-500">Total Sources Configures:</span>
              <span className="font-bold text-white">{totalSources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Environnement:</span>
              <span className="font-bold text-blue-500 uppercase">{process.env.NODE_ENV || "development"}</span>
            </div>
          </div>
        </div>

        {/* Error Logs */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Journal des Incidents API Sync
          </h2>

          <div className="space-y-4 overflow-y-auto max-h-[300px] text-xs">
            {failedJobs.map((job) => (
              <div key={job.id} className="border-l-2 border-red-500 pl-4 py-1.5 space-y-1.5 bg-red-500/5 rounded-r-lg p-3">
                <div className="flex justify-between font-semibold text-red-400">
                  <span>Sync {job.source.name} a échoué</span>
                  <span>{new Date(job.startedAt).toLocaleString("fr-FR")}</span>
                </div>
                <p className="text-zinc-300 font-mono text-[10px] break-all whitespace-pre-wrap">
                  {job.error || "Erreur inconnue de synchronisation."}
                </p>
              </div>
            ))}
            {failedJobs.length === 0 && (
              <p className="text-zinc-500 italic text-center py-6">Aucun incident de synchronisation signalé.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
