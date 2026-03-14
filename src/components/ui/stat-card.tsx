import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string;
  label: string;
  color: "cyan" | "green" | "amber" | "red" | "purple" | "blue" | "pink";
  progress?: number;
  icon?: React.ReactNode;
  subtext?: string;
}

const COLOR_MAP = {
  cyan: { border: "border-t-cyan", text: "text-cyan", bg: "bg-cyan-dim", bar: "bg-cyan" },
  green: { border: "border-t-cc-green", text: "text-cc-green", bg: "bg-green-dim", bar: "bg-cc-green" },
  amber: { border: "border-t-amber", text: "text-amber", bg: "bg-amber-dim", bar: "bg-amber" },
  red: { border: "border-t-cc-red", text: "text-cc-red", bg: "bg-red-dim", bar: "bg-cc-red" },
  purple: { border: "border-t-cc-purple", text: "text-cc-purple", bg: "bg-purple-dim", bar: "bg-cc-purple" },
  blue: { border: "border-t-cc-blue", text: "text-cc-blue", bg: "bg-blue-dim", bar: "bg-cc-blue" },
  pink: { border: "border-t-pink", text: "text-pink", bg: "bg-pink/15", bar: "bg-pink" },
};

export function StatCard({ value, label, color, progress, icon, subtext }: StatCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4 border-t-2", c.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn("text-2xl font-bold", c.text)}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
          {subtext && <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>}
        </div>
        {icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", c.bg)}>
            {icon}
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", c.bar)}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
