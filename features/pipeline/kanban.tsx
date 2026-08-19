"use client";

import React, { useState, useTransition } from "react";
import { OpportunityStatus, Opportunity } from "@prisma/client";
import { updateOpportunityStatus } from "../opportunities/actions";
import Link from "next/link";
import { MapPin, User as UserIcon, Calendar, ArrowRight } from "lucide-react";

type OpportunityWithAssigned = Opportunity & {
  assignedUser?: { name: string | null; email: string } | null;
};

interface KanbanProps {
  initialOpportunities: OpportunityWithAssigned[];
}

const COLUMNS: { status: OpportunityStatus; label: string; bg: string }[] = [
  { status: "DETECTED", label: "Détecté", bg: "border-zinc-800" },
  { status: "TO_QUALIFY", label: "À qualifier", bg: "border-amber-900/40" },
  { status: "TO_CONTACT", label: "À contacter", bg: "border-blue-900/40" },
  { status: "CONTACTED", label: "Contacté", bg: "border-purple-900/40" },
  { status: "FOLLOW_UP", label: "Relance", bg: "border-indigo-900/40" },
  { status: "MEETING", label: "RDV", bg: "border-teal-900/40" },
  { status: "QUOTE_SENT", label: "Devis envoyé", bg: "border-pink-900/40" },
  { status: "WON", label: "Gagné", bg: "border-emerald-900/40" },
  { status: "LOST", label: "Perdu", bg: "border-red-900/40" },
];

export default function KanbanBoard({ initialOpportunities }: KanbanProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [isPending, startTransition] = useTransition();

  // Handle Drag Over column
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle Card Drag Start
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  // Handle Drop on Column
  const handleDrop = async (e: React.DragEvent, targetStatus: OpportunityStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    // Find the dragged opportunity
    const opp = opportunities.find((o) => o.id === id);
    if (!opp || opp.status === targetStatus) return;

    // Save previous state for rollback
    const previousOpps = [...opportunities];

    // Optimistically update status
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: targetStatus } : o))
    );

    startTransition(async () => {
      try {
        await updateOpportunityStatus(id, targetStatus);
      } catch (err) {
        console.error("Failed to update status on server:", err);
        // Rollback state on error
        setOpportunities(previousOpps);
      }
    });
  };

  return (
    <div className="flex-1 flex overflow-x-auto p-6 gap-4 items-start select-none">
      {COLUMNS.map((col) => {
        const columnOpps = opportunities.filter((o) => o.status === col.status);
        
        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className="w-72 flex-shrink-0 flex flex-col max-h-full rounded-xl bg-zinc-900/40 border border-zinc-850 p-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">{col.label}</span>
                <span className="rounded-full bg-zinc-850 px-2 py-0.5 text-[10px] text-zinc-400 font-semibold">
                  {columnOpps.length}
                </span>
              </div>
            </div>

            {/* Cards container */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-[500px]">
              {columnOpps.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing hover:bg-zinc-900/90"
                >
                  <div className="space-y-3">
                    {/* Header: Title, company, score */}
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="font-bold text-xs text-white hover:text-blue-400 line-clamp-2 transition-colors"
                      >
                        {opp.title}
                      </Link>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          opp.score >= 80
                            ? "bg-emerald-500/10 text-emerald-400"
                            : opp.score >= 50
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-zinc-850 text-zinc-500"
                        }`}
                      >
                        {opp.score}
                      </span>
                    </div>

                    <div className="text-[10px] font-semibold text-zinc-400">
                      {opp.companyName}
                    </div>

                    {/* Metadata & Footer */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-650" />
                        <span className="truncate max-w-[120px]">{opp.location}</span>
                      </div>

                      {opp.assignedUser ? (
                        <div
                          className="flex items-center gap-1 font-semibold text-zinc-300"
                          title={`Assigné à ${opp.assignedUser.name || opp.assignedUser.email}`}
                        >
                          <UserIcon className="h-3 w-3 text-zinc-400" />
                          <span className="truncate max-w-[80px]">{opp.assignedUser.name || "Memb."}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-600">Non assigné</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {columnOpps.length === 0 && (
                <div className="h-24 flex items-center justify-center text-center rounded border border-dashed border-zinc-800 text-[10px] text-zinc-600">
                  Déposer ici
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
