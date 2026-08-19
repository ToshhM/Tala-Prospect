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
  User as UserIcon,
} from "lucide-react";
import { SignOutButton } from "./signout-button";
import { AppSidebarShell } from "@/components/app-sidebar-shell";

export default async function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
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
    pipeline: [{ name: "Pipeline CRM", href: "/pipeline", icon: Kanban }],
    team: [{ name: "Membres & Rôles", href: "/team", icon: Users }],
    data: [
      { name: "Sources de données", href: "/sources", icon: Database },
      { name: "Contacts", href: "/contacts", icon: Contact },
    ],
    admin: [{ name: "Configuration Admin", href: "/admin", icon: Settings }],
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen md:overflow-hidden bg-background text-foreground">
      <AppSidebarShell>
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm">
            T
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-foreground">TalaProspect</h1>
            <p className="text-xs text-muted-foreground">Radar commercial Talaref</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          <NavSection title="Explorer" items={menuItems.explorer} />
          <NavSection title="CRM & Pipeline" items={menuItems.pipeline} />
          <NavSection title="Équipe" items={menuItems.team} />
          <NavSection title="Données" items={menuItems.data} />

          {(user.role === "SUPER_ADMIN" || user.role === "ADMIN") && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-3 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                Administration
              </p>
              <ul className="space-y-1">
                {menuItems.admin.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-foreground">{user.name || user.email}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {user.role}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </AppSidebarShell>

      <main className="flex-1 flex flex-col min-w-0 bg-background md:overflow-hidden">
        {children}
      </main>

      {modal}
    </div>
  );
}

function NavSection({
  title,
  items,
}: {
  title: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-3">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm text-foreground/80 rounded-lg hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
