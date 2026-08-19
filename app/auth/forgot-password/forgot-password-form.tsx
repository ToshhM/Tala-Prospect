"use client";

import React, { useState, useTransition } from "react";
import { requestPasswordReset } from "@/features/auth/actions";
import Link from "next/link";
import { HelpCircle, Loader2, ShieldCheck, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await requestPasswordReset(formData);
        setSuccess(result.message);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Une erreur est survenue.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Réinitialiser vos accès à TalaProspect
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <MailCheck className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Email envoyé !</h3>
              <p className="text-xs text-zinc-400 leading-relaxed px-4">
                {success}
              </p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Adresse email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-white placeholder-zinc-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Adresse email de votre compte"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <HelpCircle className="mr-2 h-5 w-5" />
                )}
                Envoyer le lien
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center pt-2">
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
