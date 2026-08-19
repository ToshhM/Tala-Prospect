import { Flame, TrendingUp, Minus, ChevronDown } from "lucide-react";
import { Badge } from "./badge";

type Priority = "FAIBLE" | "MOYENNE" | "HAUTE" | "CRITIQUE";

const CONFIG: Record<Priority, { label: string; variant: "destructive" | "warning" | "info" | "neutral"; icon: React.ReactNode }> = {
  CRITIQUE: { label: "Critique", variant: "destructive", icon: <Flame className="h-2.5 w-2.5" /> },
  HAUTE: { label: "Haute", variant: "warning", icon: <TrendingUp className="h-2.5 w-2.5" /> },
  MOYENNE: { label: "Moyenne", variant: "info", icon: <Minus className="h-2.5 w-2.5" /> },
  FAIBLE: { label: "Faible", variant: "neutral", icon: <ChevronDown className="h-2.5 w-2.5" /> },
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const cfg = CONFIG[priority];
  return (
    <Badge variant={cfg.variant} icon={cfg.icon} className={className}>
      {cfg.label}
    </Badge>
  );
}
