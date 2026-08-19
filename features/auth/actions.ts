"use server";

import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

/**
 * Creates a new user in the database
 */
export async function signUpUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation
  const result = signupSchema.safeParse({ name, email, password });
  if (!result.success) {
    const errorMsg = result.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(errorMsg);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Cette adresse email est déjà utilisée.");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with default MEMBER role
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "MEMBER", // Secure default
    },
  });

  return {
    success: true,
    email: user.email,
    name: user.name,
  };
}

/**
 * Handles password reset request (simulates email sending in MVP/Internal tool)
 */
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    throw new Error("Veuillez saisir une adresse email valide.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // For security, don't disclose if email exists or not. Simply return success.
  console.log(`Password reset requested for: ${email}. User exists: ${!!user}`);

  return {
    success: true,
    message: "Si cette adresse existe, un email contenant les instructions de réinitialisation a été envoyé.",
  };
}
