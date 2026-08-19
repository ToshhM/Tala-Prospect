"use client";

import React, { useRef, useState, useTransition } from "react";
import { createManualOpportunity } from "@/features/sources/actions";
import { Loader2, Plus, CheckCircle, AlertTriangle } from "lucide-react";

export function ManualImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createManualOpportunity(formData);
        setSuccess("L'opportunité a été ajoutée manuellement avec succès et qualifiée !");
        formRef.current?.reset();
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Impossible de créer l'opportunité.");
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Title */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Titre de la mission *</label>
          <input
            type="text"
            name="title"
            required
            placeholder="ex: Photographe corporate pour trombinoscope"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Company name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Nom de l'entreprise *</label>
          <input
            type="text"
            name="companyName"
            required
            placeholder="ex: TechCorp Paris"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Localisation *</label>
          <input
            type="text"
            name="location"
            required
            placeholder="ex: Paris 8e ou Télétravail"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Source URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">URL Source (optionnel)</label>
          <input
            type="url"
            name="sourceUrl"
            placeholder="ex: https://malt.fr/profile/..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Budget Max */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Budget Estimé Max (EUR)</label>
          <input
            type="number"
            name="budgetMax"
            placeholder="ex: 3500"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Description détaillée de la mission *</label>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Copiez-collez la description complète du besoin du client..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Contact Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Nom du contact</label>
          <input
            type="text"
            name="contactName"
            placeholder="ex: Claire Dubois"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Email du contact</label>
          <input
            type="email"
            name="contactEmail"
            placeholder="ex: c.dubois@techcorp.com"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Contact Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Téléphone du contact</label>
          <input
            type="tel"
            name="contactPhone"
            placeholder="ex: 0601020304"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Ajouter l'opportunité
        </button>
      </div>
    </form>
  );
}
