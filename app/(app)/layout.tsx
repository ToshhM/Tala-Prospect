import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  Bell,
  Heart,
  Kanban,
  Users,
  Database,
  Contact,
  Settings,
  ShieldAlert,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { SignOutButton } from "./signout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as { name?: string; email: string; role: string };

  const menuItems = {
    explorer: [
      { name: "Opportunités", href: "/explorer", icon: Compass },
      { name: "Mes alertes", href: "/alerts", icon: Bell },
      { name: "Favoris", href: "/explorer?favorite=true", icon: Heart },
    ],
    pipeline: [
      { name: "Pipeline CRM", href: "/pipeline", icon: Kanban },
    ],
    team: [
      { name: "Membres & Rôles", href: "/team", icon: Users },
    ],
    data: [
      { name: "Sources de données", href: "/sources", icon: Database },
      { name: "Contacts", href: "/contacts", icon: Contact },
    ],
    admin: [
      { name: "Configuration Admin", href: "/admin", icon: Settings },
    ],
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/60 flex flex-col flex-shrink-0">
        {/* Header logo */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
            T
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">TalaProspect</h1>
            <p className="text-xs text-zinc-500">Radar commercial Talaref</p>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {/* EXPLORER Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
              Explorer
            </p>
            <ul className="space-y-1">
              {menuItems.explorer.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PIPELINE Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
              CRM & Pipeline
            </p>
            <ul className="space-y-1">
              {menuItems.pipeline.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* TEAM Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
              Équipe
            </p>
            <ul className="space-y-1">
              {menuItems.team.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* DATA Section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
              Données
            </p>
            <ul className="space-y-1">
              {menuItems.data.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ADMIN Section (Visible to Admins only) */}
          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                Administration
              </p>
              <ul className="space-y-1">
                {menuItems.admin.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 rounded-lg hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-zinc-400" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-white">{user.name || user.email}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                {user.role}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
