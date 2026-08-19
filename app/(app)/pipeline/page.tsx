import React from "react";
import { prisma } from "@/lib/prisma";
import KanbanBoard from "@/features/pipeline/kanban";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  // Query all opportunities in order to populate the Kanban columns
  const opportunities = await prisma.opportunity.findMany({
    orderBy: [
      { score: "desc" },
      { publishedAt: "desc" },
    ],
    include: {
      assignedUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Pipeline CRM</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Visualisez et gérez le statut de vos leads. Glissez-déposez les cartes pour changer d'étape.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-auto bg-zinc-950 flex">
        <KanbanBoard initialOpportunities={opportunities} />
      </div>
    </div>
  );
}
