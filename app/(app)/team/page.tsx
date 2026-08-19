import React from "react";
import { prisma } from "@/lib/prisma";
import { Users, Mail, Shield, Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  // Query all users and count their assigned opportunities
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { opportunities: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Membres de l'Équipe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les membres de l'équipe Talaref, leurs rôles et suivez les assignations de leads.
        </p>
      </div>

      {/* Team table grid */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4 text-center">Opportunités Assignées</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="py-4 px-4 font-semibold text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center font-bold text-xs text-foreground/80 uppercase">
                      {user.name ? user.name.substring(0, 2) : user.email.substring(0, 2)}
                    </div>
                    {user.name || "Membre sans nom"}
                  </td>
                  <td className="py-4 px-4 text-foreground/80">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {user.email}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-foreground/80 text-xs">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                        : user.role === "ADMIN"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <Shield className="h-3 w-3" />
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-muted border border-border px-3 py-1 rounded-full text-xs font-bold text-foreground">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      {user._count.opportunities}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
