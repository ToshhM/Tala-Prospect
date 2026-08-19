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
    <div className="flex-1 md:overflow-y-auto p-8 space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Sources & Imports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les synchronisations d'API automatiques ou ajoutez des leads manuellement.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-4 border-b border-border pb-px text-sm">
        <a
          href="/sources"
          className={`pb-4 font-semibold border-b-2 transition-colors ${
            !isManualImportActive
              ? "border-blue-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
              ? "border-blue-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              Sources Configurées
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-border bg-background p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{source.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Type: {source.type}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        source.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {source.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Dernière synchronisation:{" "}
                    <span className="font-semibold text-foreground/80">
                      {source.lastSyncAt
                        ? new Date(source.lastSyncAt).toLocaleString("fr-FR")
                        : "Jamais"}
                    </span>
                  </div>

                  {source.id !== "manual-source" && source.isActive && (
                    <div className="pt-2">
                      <SyncTriggerButton sourceId={source.id} sourceName={source.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sync job history */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              Historique des Sync Jobs
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-semibold">
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
                      className="border-b border-border hover:bg-card transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground/80">
                        {new Date(job.startedAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{job.source.name}</td>
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
                      <td className="py-3 px-4 text-center text-foreground/80">{job.itemsFetched}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        +{job.itemsCreated}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{job.itemsUpdated}</td>
                      <td className="py-3 px-4 text-red-400 max-w-xs truncate" title={job.error || ""}>
                        {job.error || "-"}
                      </td>
                    </tr>
                  ))}
                  {syncJobs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-muted-foreground italic">
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
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Importer une offre manuellement
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Remplissez le formulaire ci-dessous. Les algorithmes de pertinence Talaref seront appliqués instantanément.
            </p>
          </div>
          <ManualImportForm />
        </div>
      )}
    </div>
  );
}
