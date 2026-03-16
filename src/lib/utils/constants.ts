export const STAGES = ["تواصل", "تفاوض", "تجهيز", "انتظار الدفع", "مكتملة"] as const;
export const SOURCES = ["إعلانات", "تسويق", "شراكة", "توصية", "معرض", "أخرى"] as const;
export const PRIORITIES = ["عاجل", "مرتفع", "عادي"] as const;
export const TICKET_STATUSES = ["مفتوح", "قيد الحل", "محلول"] as const;
export const EMPLOYEE_STATUSES = ["نشط", "مشغول", "متاح", "إجازة"] as const;
export const PARTNERSHIP_TYPES = ["استراتيجية", "تقنية", "تجارية", "تسويقية"] as const;
export const PARTNERSHIP_STATUSES = ["شراكة نشطة", "قيد التفاوض", "شراكة مؤجلة", "شراكة مُوقفة"] as const;
export const PROJECT_STATUSES = ["في الموعد", "متأخر", "يكتمل قريباً", "موقوف"] as const;
export const REVIEW_CATEGORIES = ["الدعم", "المنتج", "التسعير", "الأداء", "التكامل", "التدريب", "أخرى"] as const;
export const REVIEW_TYPES = [
  { value: "promoter", label: "مروّج" },
  { value: "neutral", label: "محايد" },
  { value: "detractor", label: "منتقد" },
] as const;

export const RENEWAL_STATUSES = ["قيد الانتظار", "مكتمل", "ملغي"] as const;
export const RENEWAL_STATUS_COLORS: Record<string, string> = {
  "قيد الانتظار": "amber",
  "مكتمل": "cc-green",
  "ملغي": "cc-red",
};
export const RENEWAL_CANCEL_REASONS = [
  "ارتفاع السعر", "قلة الاستخدام", "التحوّل لمنافس",
  "نقص ميزات", "مشكلات تقنية", "أخرى",
] as const;

export const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
] as const;

export const STAGE_COLORS: Record<string, string> = {
  "تواصل": "cc-green",
  "تفاوض": "cc-purple",
  "تجهيز": "cyan",
  "انتظار الدفع": "amber",
  "مكتملة": "cc-green",
};

export const PRIORITY_COLORS: Record<string, string> = {
  "عاجل": "cc-red",
  "مرتفع": "amber",
  "عادي": "cc-blue",
};

export const TICKET_STATUS_COLORS: Record<string, string> = {
  "مفتوح": "cc-red",
  "قيد الحل": "amber",
  "محلول": "cc-green",
};

export const SOURCE_COLORS: Record<string, string> = {
  "إعلانات": "cyan",
  "تسويق": "cc-purple",
  "شراكة": "pink",
  "توصية": "cc-green",
  "معرض": "amber",
  "أخرى": "cc-blue",
};

export const KPI_TARGETS = {
  win_rate: 35,
  demo_conversion: 60,
  avg_cycle_days: 14,
  new_clients_month: 20,
  renewal_rate: 75,
  churn_max: 15,
  csat: 4.0,
  nps: 40,
  avg_deal_value: 45000,
  pipeline_value: 500000,
  response_time_minutes: 5,
} as const;

export function getKpiStatus(actual: number, target: number, inverted = false): "excellent" | "improving" | "behind" {
  const ratio = inverted ? target / actual : actual / target;
  if (ratio >= 1) return "excellent";
  if (ratio >= 0.7) return "improving";
  return "behind";
}

export const KPI_STATUS_STYLES = {
  excellent: { bg: "bg-cc-green/15", text: "text-cc-green", dot: "bg-cc-green", label: "ممتاز" },
  improving: { bg: "bg-amber/15", text: "text-amber", dot: "bg-amber", label: "تحسين" },
  behind: { bg: "bg-cc-red/15", text: "text-cc-red", dot: "bg-cc-red", label: "متأخر" },
} as const;

export const NAV_ITEMS = [
  { label: "نظرة عامة", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "المبيعات", href: "/sales", icon: "TrendingUp" },
  { label: "التجديدات", href: "/renewals", icon: "RefreshCw" },
  { label: "رضا العملاء", href: "/satisfaction", icon: "Heart" },
  { label: "الدعم", href: "/support", icon: "Headphones" },
  { label: "التطويرات", href: "/development", icon: "Code" },
  { label: "الشراكات", href: "/partnerships", icon: "Handshake" },
  { label: "الفريق", href: "/team", icon: "Users" },
  { label: "المالية", href: "/finance", icon: "Banknote" },
] as const;
