"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({ children }: { children: ReactNode }) {
  const router = useRouter();

  const close = () => router.back();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={close}
      />
      <div className="relative h-full w-full max-w-2xl bg-card shadow-2xl overflow-y-auto animate-drawer-in">
        <button
          onClick={close}
          className="sticky top-4 left-full -translate-x-14 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="-mt-9">{children}</div>
      </div>
    </div>
  );
}
