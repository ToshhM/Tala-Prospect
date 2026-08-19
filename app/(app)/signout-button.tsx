"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      title="Se déconnecter"
      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <LogOut className="h-4.5 w-4.5" />
    </button>
  );
}
