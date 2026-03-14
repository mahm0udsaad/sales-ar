export const STAGES = ["تواصل", "عرض سعر", "تفاوض", "إغلاق", "خسارة"] as const;
export const SOURCES = ["إعلانات", "تسويق", "شراكة", "توصية", "معرض", "أخرى"] as const;
export const PRIORITIES = ["عاجل", "مرتفع", "عادي"] as const;
export const TICKET_STATUSES = ["مفتوح", "قيد الحل", "محلول"] as const;
export const EMPLOYEE_STATUSES = ["نشط", "مشغول", "متاح", "غير نشط"] as const;
export const PARTNERSHIP_TYPES = ["استراتيجية", "تقنية", "تجارية", "تسويقية"] as const;
export const PARTNERSHIP_STATUSES = ["شراكة نشطة", "قيد التفاوض", "شراكة مؤجلة"] as const;
export const PROJECT_STATUSES = ["في الموعد", "متأخر", "يكتمل قريباً"] as const;

export const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
] as const;

export const STAGE_COLORS: Record<string, string> = {
  "تواصل": "cc-green",
  "عرض سعر": "amber",
  "تفاوض": "cc-purple",
  "إغلاق": "cyan",
  "خسارة": "cc-red",
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

export const NAV_ITEMS = [
  { label: "نظرة عامة", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "المبيعات", href: "/sales", icon: "TrendingUp" },
  { label: "الدعم", href: "/support", icon: "Headphones" },
  { label: "التطويرات", href: "/development", icon: "Code" },
  { label: "الشراكات", href: "/partnerships", icon: "Handshake" },
  { label: "الفريق", href: "/team", icon: "Users" },
  { label: "المالية", href: "/finance", icon: "DollarSign" },
] as const;
