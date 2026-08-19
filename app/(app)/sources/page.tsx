import React from "react";
import { prisma } from "@/lib/prisma";
import { SyncTriggerButton } from "./sync-trigger-btn";
import { ManualImportForm } from "./manual-import-form";
import { Database, Plus, RefreshCw, FileText, CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface SourcesPageProps {
  searchParams: Promise<{
    import?: string;
  }>;
}

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const params = await searchParams;
  const isManualImportActive = params.import === "true";

  // 1. Fetch sources
  const sources = await prisma.source.findMany({
    orderBy: { type: "asc" },
  });

  // 2. Fetch recent sync jobs
  const syncJobs = await prisma.syncJob.findMany({
    orderBy: { startedAt: "desc" },
    take: 10,
    include: {
      source: { select: { name: true } },
    },
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Sources & Imports</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gérez les synchronisations d'API automatiques ou ajoutez des leads manuellement.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-4 border-b border-zinc-850 pb-px text-sm">
        <a
          href="/sources"
          className={`pb-4 font-semibold border-b-2 transition-colors ${
            !isManualImportActive
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-450 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sources & Synchronisation
          </span>
        </a>
        <a
          href="/sources?import=true"
          className={`pb-4 font-semibold border-b-2 transition-colors ${
            isManualImportActive
              ? "border-blue-500 text-white"
              : "border-transparent text-zinc-450 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajout Manuel de Mission
          </span>
        </a>
      </div>

      {/* Content based on tab */}
      {!isManualImportActive ? (
        <div className="space-y-8">
          {/* Active sources card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-zinc-400" />
              Sources Configurées
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-white">{source.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">Type: {source.type}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        source.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {source.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400">
                    Dernière synchronisation:{" "}
                    <span className="font-semibold text-zinc-300">
                      {source.lastSyncAt
                        ? new Date(source.lastSyncAt).toLocaleString("fr-FR")
                        : "Jamais"}
                    </span>
                  </div>

                  {source.id === "france-travail-api-source" && source.isActive && (
                    <div className="pt-2">
                      <SyncTriggerButton />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sync job history */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-zinc-400" />
              Historique des Sync Jobs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-850 text-zinc-500 font-semibold">
                    <th className="py-3 px-4">Date de début</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-center">Récupérés</th>
                    <th className="py-3 px-4 text-center">Créés</th>
                    <th className="py-3 px-4 text-center">Doublons</th>
                    <th className="py-3 px-4">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {syncJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-zinc-850 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300">
                        {new Date(job.startedAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{job.source.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-bold ${
                            job.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : job.status === "RUNNING"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {job.status === "COMPLETED" && (
                            <CheckCircle className="h-3 w-3 flex-shrink-0" />
                          )}
                          {job.status === "FAILED" && (
                            <XCircle className="h-3 w-3 flex-shrink-0" />
                          )}
                          {job.status === "RUNNING" && (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          )}
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-300">{job.itemsFetched}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        +{job.itemsCreated}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-400">{job.itemsUpdated}</td>
                      <td className="py-3 px-4 text-red-400 max-w-xs truncate" title={job.error || ""}>
                        {job.error || "-"}
                      </td>
                    </tr>
                  ))}
                  {syncJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-zinc-500 italic">
                        Aucun job de synchronisation n'a encore été lancé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Importer une offre manuellement
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Remplissez le formulaire ci-dessous. Les algorithmes de pertinence Talaref seront appliqués instantanément.
            </p>
          </div>
          <ManualImportForm />
        </div>
      )}
    </div>
  );
}
