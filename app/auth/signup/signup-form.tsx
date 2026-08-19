"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/features/auth/actions";
import Link from "next/link";
import { UserPlus, Loader2, ShieldCheck, ArrowLeft, CheckCircle } from "lucide-react";

export default function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await signUpUser(formData);
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Une erreur est survenue lors de l'inscription.");
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Créer un compte
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Rejoindre le radar commercial TalaProspect
          </p>
        </div>

        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Inscription réussie !</h3>
              <p className="text-sm text-muted-foreground">
                Votre compte a été créé. Redirection vers la page de connexion...
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="sr-only">
                  Nom complet
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="relative block w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder-muted-foreground focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Nom complet (ex: Jean Dupont)"
                />
              </div>

              {/* Email */}
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
                  className="relative block w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder-muted-foreground focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Adresse email (ex: j.dupont@talaref.com)"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full rounded-lg border border-border bg-background px-3 py-3 text-foreground placeholder-muted-foreground focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Mot de passe (min 6 caractères)"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-5 w-5" />
                )}
                S'inscrire
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center pt-2">
          <Link
            href="/auth/signin"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Déjà inscrit ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
