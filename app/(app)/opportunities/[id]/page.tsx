import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  updateOpportunityStatus,
  assignOpportunity,
  addOpportunityNote,
  toggleFavorite,
} from "@/features/opportunities/actions";
import {
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  Link2,
  User as UserIcon,
  MessageSquare,
  History,
  TrendingUp,
  Heart,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { OpportunityStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface OpportunityDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailsPage({ params }: OpportunityDetailsPageProps) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const { id } = await params;

  // 1. Fetch opportunity
  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      assignedUser: true,
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true, email: true } },
        },
      },
      actions: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      favorites: userId
        ? {
            where: { userId },
          }
        : false,
    },
  });

  if (!opp) {
    notFound();
  }

  // 2. Fetch all team members for assignment
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const isFavorited = opp.favorites && opp.favorites.length > 0;

  // Form handlers via Server Actions
  async function handleStatusChange(formData: FormData) {
    "use server";
    const status = formData.get("status") as OpportunityStatus;
    if (status) {
      await updateOpportunityStatus(id, status);
    }
  }

  async function handleAssignmentChange(formData: FormData) {
    "use server";
    const assignedId = formData.get("assignedUserId") as string;
    await assignOpportunity(id, assignedId === "unassigned" ? null : assignedId);
  }

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

  const STATUS_LABELS: Record<OpportunityStatus, string> = {
    DETECTED: "Détecté",
    TO_QUALIFY: "À qualifier",
    TO_CONTACT: "À contacter",
    CONTACTED: "Contacté",
    FOLLOW_UP: "Relance",
    MEETING: "RDV fixé",
    QUOTE_SENT: "Devis envoyé",
    WON: "Gagné (Won)",
    LOST: "Perdu (Lost)",
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-950 text-white">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-6 flex-wrap gap-4">
        <div className="space-y-1">
          <Link href="/explorer" className="text-xs text-blue-500 hover:underline">
            &larr; Retour à l'explorateur
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">{opp.title}</h1>
          <p className="text-sm text-zinc-400 font-semibold">{opp.companyName}</p>
        </div>

        {/* Favorite toggle */}
        <div className="flex items-center gap-3">
          <form action={handleToggleFavorite}>
            <button
              type="submit"
              className={`rounded-lg border px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
                isFavorited
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500" : ""}`} />
              {isFavorited ? "Favori" : "Ajouter aux favoris"}
            </button>
          </form>

          {opp.sourceUrl && (
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500 transition-colors flex items-center gap-1.5"
            >
              Voir la source
              <Link2 className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column (Content, Scoring, Notes) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Why this match is interesting section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                Pourquoi cette opportunité est intéressante pour Talaref ?
              </h2>
              <div className={`h-10 w-12 rounded-lg flex items-center justify-center font-black text-sm border ${
                opp.score >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : opp.score >= 50
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}>
                {opp.score}%
              </div>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 text-xs pt-2">
              {opp.scoreReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{reason}</span>
                </div>
              ))}
              {opp.scoreReasons.length === 0 && (
                <p className="text-zinc-500 italic">Aucune raison de score identifiée.</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Description de l'offre</h2>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {opp.description}
            </div>
          </div>

          {/* Notes / Comments Section */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-zinc-400" />
              Notes & Commentaires de l'équipe ({opp.notes.length})
            </h2>

            {/* Form */}
            <form action={handleAddNote} className="space-y-3">
              <textarea
                name="content"
                rows={3}
                required
                placeholder="Ajouter des notes internes sur les échanges, relances ou qualifications..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  Ajouter la note
                </button>
              </div>
            </form>

            {/* List notes */}
            <div className="space-y-4 pt-4 border-t border-zinc-850">
              {opp.notes.map((note) => (
                <div key={note.id} className="bg-zinc-900/40 border border-zinc-850 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                    <span>{note.author.name || note.author.email}</span>
                    <span>{new Date(note.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
              {opp.notes.length === 0 && (
                <p className="text-xs text-zinc-500 italic text-center py-4">Aucune note de discussion pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Controls) */}
        <div className="space-y-8">
          {/* CRM Controls panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
            <h2 className="text-base font-bold text-white">Suivi Commercial</h2>

            {/* Status change form */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Statut du pipeline</label>
              <form action={handleStatusChange}>
                <select
                  name="status"
                  defaultValue={opp.status}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(STATUS_LABELS).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </form>
            </div>

            {/* User Assignment form */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400">Assigner à</label>
              <form action={handleAssignmentChange}>
                <select
                  name="assignedUserId"
                  defaultValue={opp.assignedUserId || "unassigned"}
                  onChange={(e) => e.target.form?.requestSubmit()}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="unassigned">Non assigné</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </form>
            </div>

            {/* Metadata summary */}
            <div className="border-t border-zinc-800 pt-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Source:</span>
                <span className="font-bold text-zinc-300 uppercase">{opp.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Localisation:</span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-zinc-500" />
                  {opp.location}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contrat:</span>
                <span className="text-zinc-300">{opp.contractType || "Non spécifié"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Budget:</span>
                <span className="text-zinc-300 font-bold">
                  {opp.budgetMax ? `${opp.budgetMax} €` : opp.salaryMax ? `${opp.salaryMax} €` : "À négocier"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date de détection:</span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-zinc-500" />
                  {new Date(opp.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>

          {/* History / Actions Log panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-400" />
              Historique des Actions
            </h2>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 text-xs">
              {opp.actions.map((act) => (
                <div key={act.id} className="border-l-2 border-zinc-800 pl-3 py-1 space-y-1">
                  <p className="text-zinc-300 font-medium leading-relaxed">
                    {act.details || `Action: ${act.type}`}
                  </p>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Par {act.user.name || act.user.email}</span>
                    <span>{new Date(act.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                </div>
              ))}
              {opp.actions.length === 0 && (
                <p className="text-zinc-500 italic text-center py-2">Aucune action enregistrée pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
