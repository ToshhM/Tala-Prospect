"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Non autorisé.");
  }
  return session;
}

export async function createAlert(formData: FormData) {
  const session = await getAuthSession();
  const userId = (session.user as any).id;

  const name = formData.get("name") as string;
  const categoriesText = formData.get("categories") as string;
  const keywordsText = formData.get("keywords") as string;
  const locationsText = formData.get("locations") as string;
  const minScoreText = formData.get("minScore") as string;
  const minBudgetText = formData.get("minBudget") as string;
  const remoteOnly = formData.get("remoteOnly") === "true";

  if (!name) {
    throw new Error("Le nom de l'alerte est requis.");
  }

  const categories = categoriesText ? categoriesText.split(",").map((c) => c.trim()).filter(Boolean) : [];
  const keywords = keywordsText ? keywordsText.split(",").map((k) => k.trim()).filter(Boolean) : [];
  const locations = locationsText ? locationsText.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const minScore = minScoreText ? parseInt(minScoreText) : 0;
  const minBudget = minBudgetText ? parseFloat(minBudgetText) : null;

  const alert = await prisma.alert.create({
    data: {
      userId,
      name,
      categories,
      keywords,
      locations,
      minScore,
      minBudget,
      remoteOnly,
      sources: ["FRANCE_TRAVAIL", "MANUAL"], // default MVP sources
      isActive: true,
    },
  });

  revalidatePath("/alerts");
  return alert;
}

export async function toggleAlertActive(id: string, isActive: boolean) {
  await getAuthSession();
  const updated = await prisma.alert.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/alerts");
  return updated;
}

export async function deleteAlert(id: string) {
  await getAuthSession();
  const deleted = await prisma.alert.delete({
    where: { id },
  });
  revalidatePath("/alerts");
  return deleted;
}
