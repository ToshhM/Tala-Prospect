import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { addOpportunityNote, toggleFavorite } from "@/features/opportunities/actions";
import { StatusAssigneeForm } from "@/app/(app)/opportunities/[id]/status-assignee-form";
import {
  MapPin,
  Clock,
  Link2,
  User as UserIcon,
  MessageSquare,
  History,
  TrendingUp,
  Heart,
  CheckCircle,
  ExternalLink,
  Maximize2,
} from "lucide-react";
import { OpportunityStatus } from "@prisma/client";
import { ScoreBadge } from "@/components/ui/score-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { getPriorityFromScore } from "@/services/scoring/scoring";

const STATUS_LABELS: Record<OpportunityStatus, string> = {
  DETECTED: "Détecté",
  CANDIDATURE: "R0 - Candidature",
  RENDEZ_VOUS: "R1 - Rendez-vous",
  PROPOSITION: "R2 - Proposition",
  WON: "Gagné",
  LOST: "Perdu",
};

export async function OpportunityDetailContent({
  id,
  variant = "page",
}: {
  id: string;
  variant?: "page" | "modal";
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      assignedUser: true,
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } },
      actions: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } } } },
      favorites: userId ? { where: { userId } } : false,
    },
  });

  if (!opp) notFound();

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const isFavorited = opp.favorites && opp.favorites.length > 0;
  const priority = getPriorityFromScore(opp.score, opp.isUrgent);

  async function handleAddNote(formData: FormData) {
    "use server";
    const content = formData.get("content") as string;
    if (content && content.trim()) {
      await addOpportunityNote(id, content);
    }
  }

  async function handleToggleFavorite() {
    "use server";
    await toggleFavorite(id);
  }

  return (
    <div className={variant === "modal" ? "p-6 space-y-6" : "p-8 space-y-8"}>
      <div className="flex items-start justify-between border-b border-border pb-6 flex-wrap gap-4">
        <div className="space-y-1.5 pr-10">
          {variant === "page" ? (
            <Link href="/explorer" className="text-xs text-primary hover:underline font-medium">
              &larr; Retour à l&apos;explorateur
            </Link>
          ) : (
            <Link
              href={`/opportunities/${opp.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              <Maximize2 className="h-3 w-3" />
              Ouvrir en page complète
            </Link>
          )}
          <h1 className="text-xl font-bold tracking-tight text-foreground">{opp.title}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground font-semibold">{opp.companyName}</p>
            <PriorityBadge priority={priority} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <form action={handleToggleFavorite}>
            <button
              type="submit"
              className={`rounded-lg border px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                isFavorited
                  ? "bg-destructive/10 text-destructive border-destructive/25"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-destructive" : ""}`} />
              {isFavorited ? "Favori" : "Favoris"}
            </button>
          </form>

          {opp.sourceUrl && (
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Source
              <Link2 className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className={variant === "modal" ? "space-y-6" : "grid gap-8 lg:grid-cols-3"}>
        <div className={variant === "modal" ? "space-y-6" : "lg:col-span-2 space-y-8"}>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pourquoi cette opportunité est intéressante ?
              </h2>
              <ScoreBadge score={opp.score} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-xs pt-2">
              {opp.scoreReasons.map((reason, idx) => (
                <ScoreReasonRow key={idx} reason={reason} />
              ))}
              {opp.scoreReasons.length === 0 && (
                <p className="text-muted-foreground italic">Aucune raison de score identifiée.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground">Description de l&apos;offre</h2>
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {opp.description}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Notes & Commentaires de l&apos;équipe ({opp.notes.length})
            </h2>

            <form action={handleAddNote} className="space-y-3">
              <textarea
                name="content"
                rows={3}
                required
                placeholder="Ajouter des notes internes sur les échanges, relances ou qualifications..."
                className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-secondary hover:bg-muted border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors"
                >
                  Ajouter la note
                </button>
              </div>
            </form>

            <div className="space-y-4 pt-4 border-t border-border">
              {opp.notes.map((note) => (
                <div key={note.id} className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>{note.author.name || note.author.email}</span>
                    <span>{new Date(note.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
              {opp.notes.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">
                  Aucune note de discussion pour le moment.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h2 className="text-base font-bold text-foreground">Suivi Commercial</h2>

            <StatusAssigneeForm
              opportunityId={opp.id}
              currentStatus={opp.status}
              currentAssignedUserId={opp.assignedUserId}
              users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))}
              statusLabels={STATUS_LABELS}
            />

            <div className="border-t border-border pt-4 space-y-3 text-xs">
              <Row label="Source" value={opp.source.toUpperCase()} />
              <Row
                label="Localisation"
                value={
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {opp.location}
                  </span>
                }
              />
              <Row label="Contrat" value={opp.contractType || "Non spécifié"} />
              <Row
                label="Budget"
                value={
                  <span className="font-bold">
                    {opp.budgetMax ? `${opp.budgetMax} €` : opp.salaryMax ? `${opp.salaryMax} €` : "À négocier"}
                  </span>
                }
              />
              <Row
                label="Détecté le"
                value={
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {new Date(opp.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                }
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              Contact & Recruteur
            </h2>

            {opp.contactName ? (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground font-semibold block">Décideur / Recruteur :</span>
                  <span className="font-bold text-foreground">{opp.contactName}</span>
                </div>

                {opp.contactEmail && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold block">Moyen de contact :</span>
                    {opp.contactEmail.startsWith("http") ? (
                      <a
                        href={opp.contactEmail}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold flex items-center gap-1.5"
                      >
                        Profil LinkedIn du Recruteur
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <a href={`mailto:${opp.contactEmail}`} className="text-primary hover:underline font-bold">
                        {opp.contactEmail}
                      </a>
                    )}
                  </div>
                )}

                {opp.contactPhone && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold block">Téléphone :</span>
                    <a href={`tel:${opp.contactPhone}`} className="text-foreground/80 hover:text-foreground">
                      {opp.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground italic">Aucun recruteur n&apos;a encore été détecté pour cette offre.</p>
                <a
                  href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                    `${opp.companyName} recruiter`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center rounded-lg bg-secondary border border-border px-4 py-2.5 font-semibold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                >
                  Chercher le décideur sur LinkedIn
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              Historique des Actions
            </h2>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 text-xs">
              {opp.actions.map((act) => (
                <div key={act.id} className="border-l-2 border-border pl-3 py-1 space-y-1">
                  <p className="text-foreground/80 font-medium leading-relaxed">{act.details || `Action: ${act.type}`}</p>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Par {act.user.name || act.user.email}</span>
                    <span>{new Date(act.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
              ))}
              {opp.actions.length === 0 && (
                <p className="text-muted-foreground italic text-center py-2">Aucune action enregistrée pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground/80">{value}</span>
    </div>
  );
}

function ScoreReasonRow({ reason }: { reason: string }) {
  const isNegative = /\[-\d+\]/.test(reason);
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${isNegative ? "text-destructive" : "text-success"}`} />
      <span>{reason}</span>
    </div>
  );
}
