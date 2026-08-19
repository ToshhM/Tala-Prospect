"use client";

import React, { useState, useTransition } from "react";
import { triggerFranceTravailSync } from "@/features/sources/actions";
import { RefreshCw, Play, AlertTriangle, CheckCircle } from "lucide-react";

export function SyncTriggerButton() {
  const [isPending, startTransition] = useTransition();
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSync = () => {
    setStatusText(null);
    setErrorText(null);
    startTransition(async () => {
      try {
        const result = await triggerFranceTravailSync();
        setStatusText(result);
      } catch (err: any) {
        console.error(err);
        setErrorText(err.message || "La synchronisation a échoué.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isPending ? "Synchronisation en cours..." : "Lancer la synchronisation France Travail"}
        </button>
      </div>

      {statusText && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{statusText}</span>
        </div>
      )}

      {errorText && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{errorText}</span>
        </div>
      )}
    </div>
  );
}
