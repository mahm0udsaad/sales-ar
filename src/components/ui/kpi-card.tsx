import { cn } from "@/lib/utils";
import { KPI_STATUS_STYLES } from "@/lib/utils/constants";
import { Check, X } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  target: string;
  status: "excellent" | "improving" | "behind";
  icon?: React.ReactNode;
}

const STATUS_GRADIENT: Record<string, string> = {
  excellent: "linear-gradient(to bottom, rgba(16,185,129,0.10), rgba(16,185,129,0.02))",
  improving: "linear-gradient(to bottom, rgba(245,158,11,0.10), rgba(245,158,11,0.02))",
  behind: "linear-gradient(to bottom, rgba(239,68,68,0.10), rgba(239,68,68,0.02))",
};

const STATUS_BORDER_COLOR: Record<string, string> = {
  excellent: "#10B981",
  improving: "#F59E0B",
  behind: "#EF4444",
};

const STATUS_VALUE_COLOR: Record<string, string> = {
  excellent: "text-cc-green",
  improving: "text-amber",
  behind: "text-cc-red",
};

const STATUS_ICON_BG: Record<string, string> = {
  excellent: "bg-cc-green/15",
  improving: "bg-amber/15",
  behind: "bg-cc-red/15",
};

export function KPICard({ label, value, target, status, icon }: KPICardProps) {
  const styles = KPI_STATUS_STYLES[status];
  const StatusIcon = status === "behind" ? X : Check;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border border-t-2 p-4"
      style={{
        background: STATUS_GRADIENT[status],
        borderTopColor: STATUS_BORDER_COLOR[status],
      }}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <span className={STATUS_VALUE_COLOR[status]}>{icon}</span>
        )}
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center",
          STATUS_ICON_BG[status]
        )}>
          <StatusIcon className={cn("w-4 h-4", STATUS_VALUE_COLOR[status])} />
        </div>
      </div>

      <p className={cn("text-2xl font-extrabold", STATUS_VALUE_COLOR[status])}>
        {value}
      </p>

      <p className="text-xs text-muted-foreground mt-1">{label}</p>

      <div className="flex items-center gap-2 mt-3">
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          styles.bg, styles.text
        )}>
          {styles.label}
        </span>
        <span className="text-[10px] text-muted-foreground">
          الهدف: {target}
        </span>
      </div>
    </div>
  );
}
