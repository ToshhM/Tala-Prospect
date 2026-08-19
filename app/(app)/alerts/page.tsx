import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AlertCard } from "@/features/alerts/alert-card";
import { createAlert } from "@/features/alerts/actions";
import Link from "next/link";
import { Bell, Play, Plus, Briefcase, ChevronRight, CheckCircle, ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }
  const userId = (session.user as any).id;

  // 1. Fetch user alerts
  const alerts = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch top 100 recent opportunities to match against active alerts
  const opportunities = await prisma.opportunity.findMany({
    where: {
      status: { in: ["DETECTED", "TO_QUALIFY", "TO_CONTACT"] },
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  // 3. Match Engine (run in JS on-the-fly)
  const matchedOppsMap: Record<string, typeof opportunities> = {};
  
  const activeAlerts = alerts.filter((a) => a.isActive);

  for (const alert of activeAlerts) {
    matchedOppsMap[alert.id] = opportunities.filter((opp) => {
      // Category Match
      if (alert.categories.length > 0) {
        if (!alert.categories.some((cat) => cat.toUpperCase() === opp.category.toUpperCase())) {
          return false;
        }
      }

      // Location Match
      if (alert.locations.length > 0) {
        const oppLoc = opp.location.toLowerCase();
        if (!alert.locations.some((loc) => oppLoc.includes(loc.toLowerCase()))) {
          return false;
        }
      }

      // Score Match
      if (opp.score < alert.minScore) {
        return false;
      }

      // Budget Match
      if (alert.minBudget) {
        const budget = opp.budgetMax || opp.salaryMax || 0;
        if (budget < alert.minBudget) {
          return false;
        }
      }

      // Remote Match
      if (alert.remoteOnly && !opp.isRemote) {
        return false;
      }

      return true;
    });
  }

  // Create form submit action
  async function handleCreateAlert(formData: FormData) {
    "use server";
    await createAlert(formData);
  }

  return (
    <div className="flex-1 md:overflow-y-auto p-8 space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes Alertes Radar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configurez des filtres intelligents et recevez des signaux d'opportunités pertinents.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Columns (Alert List & Creation) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Alerts List */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              Alertes Configurées ({alerts.length})
            </h2>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  Vous n'avez pas encore configuré d'alerte radar. Remplissez le formulaire à droite pour commencer !
                </div>
              )}
            </div>
          </div>

          {/* Matched opportunities list */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Matchs Détectés Récemment
            </h2>

            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const matches = matchedOppsMap[alert.id] || [];
                if (matches.length === 0) return null;

                return (
                  <div key={alert.id} className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground border-b border-border pb-1.5 uppercase tracking-wider">
                      Filtre: {alert.name} ({matches.length})
                    </p>
                    <ul className="space-y-2">
                      {matches.map((opp) => (
                        <li
                          key={opp.id}
                          className="rounded-lg border border-border bg-background/40 p-3 hover:border-border transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 overflow-hidden">
                            <p className="text-xs font-bold text-foreground truncate">{opp.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {opp.companyName} • {opp.location} • Score: {opp.score}%
                            </p>
                          </div>
                          <Link
                            href={`/opportunities/${opp.id}`}
                            className="rounded bg-muted px-3 py-1.5 text-[10px] font-bold hover:bg-muted transition-colors flex items-center gap-1 flex-shrink-0"
                          >
                            Voir
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {activeAlerts.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Activez une alerte pour voir les opportunités correspondantes.
                </p>
              )}

              {activeAlerts.length > 0 &&
                Object.values(matchedOppsMap).every((m) => m.length === 0) && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    Aucune opportunité récente ne correspond à vos filtres d'alertes actives.
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Right Column (Create Alert Form) */}
        <div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-400" />
              Créer une Alerte
            </h2>

            <form action={handleCreateAlert} className="space-y-4 text-xs">
              {/* Alert name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Nom de l'alerte *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="ex: Vidéo Paris Haute Qualité"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Categories */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Catégories (séparées par des virgules)
                </label>
                <input
                  type="text"
                  name="categories"
                  placeholder="ex: PHOTO, VIDEO, EVENT"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Mots-clés requis (séparés par des virgules)
                </label>
                <input
                  type="text"
                  name="keywords"
                  placeholder="ex: aftermovie, cadreur, drone"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Locations */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">
                  Villes / Régions (séparées par des virgules)
                </label>
                <input
                  type="text"
                  name="locations"
                  placeholder="ex: Paris, Versailles, IDF"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Min Score */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Score de pertinence minimum</label>
                <input
                  type="number"
                  name="minScore"
                  min={0}
                  max={100}
                  placeholder="ex: 75"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Min Budget */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Budget minimum (€)</label>
                <input
                  type="number"
                  name="minBudget"
                  placeholder="ex: 2000"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Remote Only */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="remoteOnly"
                  name="remoteOnly"
                  value="true"
                  className="rounded bg-background border-border text-blue-600 focus:ring-0"
                />
                <label htmlFor="remoteOnly" className="font-semibold text-muted-foreground cursor-pointer">
                  Télétravail uniquement
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Créer l'alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
