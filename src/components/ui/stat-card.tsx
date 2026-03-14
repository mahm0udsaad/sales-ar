import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatCardProps {
  value: string;
  label: string;
  color: "cyan" | "green" | "amber" | "red" | "purple" | "blue" | "pink";
  progress?: number;
  icon?: React.ReactNode;
  subtext?: string;
  muted?: boolean;
  tooltip?: string;
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

export function StatCard({ value, label, color, progress, icon, subtext, muted, tooltip }: StatCardProps) {
  const c = COLOR_MAP[color];
  const content = (
    <div
      className={cn(
        "glass-surface relative overflow-hidden rounded-[24px] p-4 transition-opacity",
        muted && "opacity-60"
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-px opacity-80", c.bar)} />
      <div className={cn("absolute -left-8 top-[-20%] h-24 w-24 rounded-full blur-3xl opacity-20", c.bg)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className={cn("mt-2 text-3xl font-extrabold tracking-tight", c.text)}>{value}</p>
          {subtext && <p className="text-[11px] text-muted-foreground mt-1.5">{subtext}</p>}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center ring-1 ring-white/8", c.bg)}>
            {icon}
          </div>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-4 w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", c.bar)}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );

  if (!tooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<div />}>{content}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
