"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export function AppSidebarShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <header className="md:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            T
          </div>
          <span className="font-bold text-sm text-foreground">TalaProspect</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-foreground/70 hover:text-foreground"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card shadow-2xl flex flex-col overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            {children}
          </div>
        </div>
      )}

      <aside className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 border-r border-border bg-card">
        {children}
      </aside>
    </>
  );
}
