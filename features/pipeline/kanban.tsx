"use client";

import React, { useState, useTransition } from "react";
import { OpportunityStatus, Opportunity } from "@prisma/client";
import { updateOpportunityStatus } from "../opportunities/actions";
import Link from "next/link";
import { MapPin, User as UserIcon } from "lucide-react";
import { ScoreBadge } from "@/components/ui/score-badge";

type OpportunityWithAssigned = Opportunity & {
  assignedUser?: { name: string | null; email: string } | null;
};

interface KanbanProps {
  initialOpportunities: OpportunityWithAssigned[];
}

const COLUMNS: { status: OpportunityStatus; label: string }[] = [
  { status: "DETECTED", label: "Détecté" },
  { status: "CANDIDATURE", label: "R0 - Candidature" },
  { status: "RENDEZ_VOUS", label: "R1 - Rendez-vous" },
  { status: "PROPOSITION", label: "R2 - Proposition" },
  { status: "WON", label: "Gagné" },
  { status: "LOST", label: "Perdu" },
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
            className="w-72 flex-shrink-0 flex flex-col max-h-full rounded-xl bg-muted/40 border border-border p-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-foreground">{col.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-semibold">
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
                  className="rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="space-y-3">
                    {/* Header: Title, company, score */}
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        href={`/opportunities/${opp.id}`}
                        className="font-bold text-xs text-foreground hover:text-primary line-clamp-2 transition-colors"
                      >
                        {opp.title}
                      </Link>
                      <ScoreBadge score={opp.score} size="sm" />
                    </div>

                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {opp.companyName}
                    </div>

                    {/* Metadata & Footer */}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{opp.location}</span>
                      </div>

                      {opp.assignedUser ? (
                        <div
                          className="flex items-center gap-1 font-semibold text-foreground/70"
                          title={`Assigné à ${opp.assignedUser.name || opp.assignedUser.email}`}
                        >
                          <UserIcon className="h-3 w-3" />
                          <span className="truncate max-w-[80px]">{opp.assignedUser.name || "Memb."}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-muted-foreground/70">Non assigné</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {columnOpps.length === 0 && (
                <div className="h-24 flex items-center justify-center text-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
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
