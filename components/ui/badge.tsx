import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  primary: "bg-accent text-accent-foreground border-accent",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export function Badge({
  children,
  variant = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
