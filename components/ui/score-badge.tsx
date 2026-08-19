import { cn } from "@/lib/utils";

export function ScoreBadge({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const tier =
    score >= 80
      ? "bg-success/10 text-success border-success/25"
      : score >= 50
      ? "bg-blue-500/10 text-blue-600 border-blue-500/25"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border font-extrabold",
        size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm",
        tier,
        className
      )}
    >
      {score}
    </div>
  );
}
