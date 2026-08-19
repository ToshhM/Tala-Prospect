import React, { Suspense } from "react";
import SignUpForm from "./signup-form";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
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
      <SignUpForm />
    </Suspense>
  );
}
