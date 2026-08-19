"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { OpportunityStatus, ActionType } from "@prisma/client";

/**
 * Ensures user is authenticated and returns their session profile
 */
async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Non autorisé. Veuillez vous connecter.");
  }
  return session;
}

/**
 * Updates the CRM status of an opportunity
 */
export async function updateOpportunityStatus(id: string, status: OpportunityStatus) {
  const session = await getAuthSession();
  const userId = (session.user as any).id;

  const currentOpp = await prisma.opportunity.findUnique({
    where: { id },
    select: { status: true },
  });

  if (!currentOpp) {
    throw new Error("Opportunité introuvable.");
  }

  // Update status
  const updated = await prisma.opportunity.update({
    where: { id },
    data: { status },
  });

  // Log action
  let actionType: ActionType = "STATUS_CHANGE";
  if (status === "WON") actionType = "WON";
  if (status === "LOST") actionType = "LOST";
  if (status === "QUOTE_SENT") actionType = "QUOTE";

  await prisma.opportunityAction.create({
    data: {
      opportunityId: id,
      userId,
      type: actionType,
      details: `Statut modifié de ${currentOpp.status} à ${status}`,
    },
  });

  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/");

  return updated;
}

/**
 * Assigns an opportunity to a team member
 */
export async function assignOpportunity(id: string, assignedUserId: string | null) {
  const session = await getAuthSession();
  const userId = (session.user as any).id;

  const userToAssign = assignedUserId
    ? await prisma.user.findUnique({ where: { id: assignedUserId } })
    : null;

  const updated = await prisma.opportunity.update({
    where: { id },
    data: { assignedUserId },
  });

  await prisma.opportunityAction.create({
    data: {
      opportunityId: id,
      userId,
      type: "ASSIGN",
      details: userToAssign
        ? `Assigné à ${userToAssign.name || userToAssign.email}`
        : "Assignation retirée",
    },
  });

  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/explorer");

  return updated;
}

/**
 * Adds a discussion note to an opportunity
 */
export async function addOpportunityNote(id: string, content: string) {
  const session = await getAuthSession();
  const authorId = (session.user as any).id;

  if (!content.trim()) {
    throw new Error("Le contenu de la note ne peut pas être vide.");
  }

  const note = await prisma.opportunityNote.create({
    data: {
      opportunityId: id,
      authorId,
      content,
    },
  });

  await prisma.opportunityAction.create({
    data: {
      opportunityId: id,
      userId: authorId,
      type: "NOTE",
      details: "Nouvelle note ajoutée",
    },
  });

  revalidatePath(`/opportunities/${id}`);
  return note;
}

/**
 * Toggles an opportunity favorite state for the active user
 */
export async function toggleFavorite(opportunityId: string) {
  const session = await getAuthSession();
  const userId = (session.user as any).id;

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_opportunityId: {
        userId,
        opportunityId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        opportunityId,
      },
    });
  }

  revalidatePath("/explorer");
  revalidatePath("/pipeline");
  revalidatePath("/");
  revalidatePath(`/opportunities/${opportunityId}`);
}
