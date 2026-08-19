import React, { Suspense } from "react";
import SignInForm from "./signin-form";
import { Loader2 } from "lucide-react";

// Enforce dynamic rendering for this page to bypass static pre-rendering during next build
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="text-zinc-500 text-sm flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            Chargement...
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
