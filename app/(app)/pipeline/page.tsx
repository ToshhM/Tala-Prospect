import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import KanbanBoard from "@/features/pipeline/kanban";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  // Query only opportunities that the user liked (favorited) OR that have a status other than DETECTED
  const opportunities = await prisma.opportunity.findMany({
    where: {
      OR: [
        { status: { not: "DETECTED" } },
        {
          favorites: {
            some: {
              userId: userId || "",
            },
          },
        },
      ],
    },
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
      <div className="border-b border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline CRM</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visualisez et gérez le statut de vos leads actifs. Glissez-déposez les cartes pour changer d'étape.
          </p>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 overflow-auto bg-background flex">
        <KanbanBoard initialOpportunities={opportunities} />
      </div>
    </div>
  );
}
