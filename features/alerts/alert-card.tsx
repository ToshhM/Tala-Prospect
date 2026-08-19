"use client";

import React, { useTransition } from "react";
import { Alert } from "@prisma/client";
import { toggleAlertActive, deleteAlert } from "./actions";
import { Bell, BellOff, Trash2, ShieldAlert } from "lucide-react";

export function AlertCard({ alert }: { alert: Alert }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleAlertActive(alert.id, !alert.isActive);
    });
  };

  const handleDelete = () => {
    if (confirm("Voulez-vous vraiment supprimer cette alerte ?")) {
      startTransition(async () => {
        await deleteAlert(alert.id);
      });
    }
  };

  return (
    <div
      className={`rounded-xl border p-5 flex items-center justify-between gap-4 transition-all ${
        alert.isActive
          ? "bg-card border-border"
          : "bg-background border-border opacity-60"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">{alert.name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              alert.isActive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {alert.isActive ? "Active" : "Désactivée"}
          </span>
        </div>

        {/* Criteria Summary badges */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          {alert.categories.length > 0 && (
            <span className="bg-muted border border-border px-2 py-0.5 rounded text-foreground/80">
              Cat: {alert.categories.join(", ")}
            </span>
          )}
          {alert.locations.length > 0 && (
            <span className="bg-muted border border-border px-2 py-0.5 rounded text-foreground/80">
              Lieu: {alert.locations.join(", ")}
            </span>
          )}
          {alert.minScore > 0 && (
            <span className="bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 rounded text-blue-400">
              Score &ge; {alert.minScore}
            </span>
          )}
          {alert.minBudget && (
            <span className="bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400">
              Budget &ge; {alert.minBudget} €
            </span>
          )}
          {alert.remoteOnly && (
            <span className="bg-indigo-500/15 border border-indigo-500/20 px-2 py-0.5 rounded text-indigo-400">
              Remote uniquement
            </span>
          )}
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`p-2 rounded-lg border transition-colors ${
            alert.isActive
              ? "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              : "border-border hover:bg-card text-muted-foreground hover:text-foreground/80"
          }`}
          title={alert.isActive ? "Désactiver l'alerte" : "Activer l'alerte"}
        >
          {alert.isActive ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-2 rounded-lg border border-border hover:border-red-900/50 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          title="Supprimer l'alerte"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
