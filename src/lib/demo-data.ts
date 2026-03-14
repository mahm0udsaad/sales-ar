import type { Deal, Ticket, Employee, Project, Partnership, KPISnapshot } from "@/types";

// Demo data used until Supabase is connected
export const DEMO_EMPLOYEES: Employee[] = [
  { id: "1", org_id: "1", name: "نورة", role: "مديرة مبيعات", status: "نشط", created_at: "" },
  { id: "2", org_id: "1", name: "خالد", role: "مدير حسابات", status: "مشغول", created_at: "" },
  { id: "3", org_id: "1", name: "سارة", role: "أخصائية مبيعات", status: "نشط", created_at: "" },
  { id: "4", org_id: "1", name: "محمد", role: "مطور رئيسي", status: "متاح", created_at: "" },
  { id: "5", org_id: "1", name: "أحمد", role: "مهندس دعم", status: "نشط", created_at: "" },
  { id: "6", org_id: "1", name: "لينا", role: "مصممة UI/UX", status: "نشط", created_at: "" },
];

export const DEMO_DEALS: Deal[] = [
  { id: "d1", org_id: "1", client_name: "مطعم الشرق", client_phone: "0551234567", deal_value: 48000, source: "إعلانات", stage: "تفاوض", probability: 75, assigned_rep_name: "سارة", cycle_days: 14, deal_date: "2025-03-01", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "d2", org_id: "1", client_name: "كافيه المدينة", client_phone: "0559876543", deal_value: 65000, source: "توصية", stage: "عرض سعر", probability: 60, assigned_rep_name: "نورة", cycle_days: 7, deal_date: "2025-03-05", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "d3", org_id: "1", client_name: "مطاعم السلام", client_phone: "0554443322", deal_value: 92000, source: "شراكة", stage: "إغلاق", probability: 95, assigned_rep_name: "خالد", cycle_days: 21, deal_date: "2025-03-02", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "d4", org_id: "1", client_name: "بيتزا هت - فرع الرياض", client_phone: "0551112233", deal_value: 120000, source: "تسويق", stage: "تواصل", probability: 30, assigned_rep_name: "أحمد", cycle_days: 3, deal_date: "2025-03-10", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "d5", org_id: "1", client_name: "مطعم البيت", client_phone: "0557778899", deal_value: 36000, source: "معرض", stage: "تفاوض", probability: 80, assigned_rep_name: "محمد", cycle_days: 18, deal_date: "2025-02-28", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "d6", org_id: "1", client_name: "شاورما بلس", client_phone: "0552223344", deal_value: 55000, source: "إعلانات", stage: "عرض سعر", probability: 50, assigned_rep_name: "سارة", cycle_days: 10, deal_date: "2025-03-08", month: 3, year: 2025, created_at: "", updated_at: "" },
];

export const DEMO_TICKETS: Ticket[] = [
  { id: "t1", org_id: "1", ticket_number: 101, client_name: "مطعم الشرق", client_phone: "0551234567", issue: "مشكلة في تسجيل الدخول", priority: "عاجل", status: "مفتوح", assigned_agent_name: "أحمد", open_date: "2025-03-12", due_date: "2025-03-13", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "t2", org_id: "1", ticket_number: 102, client_name: "كافيه المدينة", client_phone: "0559876543", issue: "خطأ في الفواتير", priority: "مرتفع", status: "قيد الحل", assigned_agent_name: "سارة", open_date: "2025-03-11", due_date: "2025-03-14", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "t3", org_id: "1", ticket_number: 103, client_name: "مطاعم السلام", client_phone: "0554443322", issue: "تعطل API", priority: "عاجل", status: "مفتوح", assigned_agent_name: "محمد", open_date: "2025-03-13", due_date: "2025-03-14", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "t4", org_id: "1", ticket_number: 104, client_name: "بيتزا هت", client_phone: "0551112233", issue: "بطء في التحميل", priority: "عادي", status: "محلول", assigned_agent_name: "لينا", open_date: "2025-03-10", due_date: "2025-03-12", resolved_date: "2025-03-11", month: 3, year: 2025, created_at: "", updated_at: "" },
  { id: "t5", org_id: "1", ticket_number: 105, client_name: "مطعم البيت", client_phone: "0557778899", issue: "مشكلة في الإشعارات", priority: "عادي", status: "قيد الحل", assigned_agent_name: "خالد", open_date: "2025-03-09", due_date: "2025-03-15", month: 3, year: 2025, created_at: "", updated_at: "" },
];

export const DEMO_PROJECTS: Project[] = [
  { id: "p1", org_id: "1", name: "تطوير تطبيق الجوال", team: "فريق التطوير", start_date: "2025-01-15", progress: 72, total_tasks: 45, remaining_tasks: 13, status_tag: "في الموعد", created_at: "", updated_at: "" },
  { id: "p2", org_id: "1", name: "نظام إدارة المخزون", team: "فريق المنتج", start_date: "2025-02-01", progress: 45, total_tasks: 30, remaining_tasks: 17, status_tag: "متأخر", created_at: "", updated_at: "" },
  { id: "p3", org_id: "1", name: "بوابة الدفع الإلكتروني", team: "فريق التقنية", start_date: "2025-02-15", progress: 88, total_tasks: 25, remaining_tasks: 3, status_tag: "يكتمل قريباً", created_at: "", updated_at: "" },
  { id: "p4", org_id: "1", name: "لوحة تحليلات العملاء", team: "فريق البيانات", start_date: "2025-03-01", progress: 20, total_tasks: 40, remaining_tasks: 32, status_tag: "في الموعد", created_at: "", updated_at: "" },
  { id: "p5", org_id: "1", name: "تحديث واجهة المستخدم", team: "فريق التصميم", start_date: "2025-02-20", progress: 60, total_tasks: 20, remaining_tasks: 8, status_tag: "في الموعد", created_at: "", updated_at: "" },
];

export const DEMO_PARTNERSHIPS: Partnership[] = [
  { id: "pr1", org_id: "1", name: "شركة فودكس", type: "استراتيجية", status: "شراكة نشطة", value: 1200000, manager_name: "نورة", description: "شراكة استراتيجية في مجال أنظمة نقاط البيع", created_at: "", updated_at: "" },
  { id: "pr2", org_id: "1", name: "تابي", type: "تقنية", status: "شراكة نشطة", value: 800000, manager_name: "خالد", description: "تكامل حلول الدفع الآجل", created_at: "", updated_at: "" },
  { id: "pr3", org_id: "1", name: "هنقرستيشن", type: "تجارية", status: "قيد التفاوض", value: 650000, manager_name: "سارة", description: "شراكة توصيل متكاملة", created_at: "", updated_at: "" },
  { id: "pr4", org_id: "1", name: "STC Solutions", type: "تقنية", status: "شراكة نشطة", value: 500000, manager_name: "محمد", description: "حلول الاتصالات والبنية التحتية", created_at: "", updated_at: "" },
  { id: "pr5", org_id: "1", name: "Zid", type: "تسويقية", status: "قيد التفاوض", value: 300000, manager_name: "أحمد", description: "شراكة تسويقية مشتركة", created_at: "", updated_at: "" },
  { id: "pr6", org_id: "1", name: "مرسول", type: "تجارية", status: "شراكة مؤجلة", value: 150000, manager_name: "لينا", description: "تكامل خدمات التوصيل", created_at: "", updated_at: "" },
];

export const DEMO_MONTHLY_KPI: { month: string; revenue: number; target: number }[] = [
  { month: "يناير", revenue: 183000, target: 200000 },
  { month: "فبراير", revenue: 225000, target: 210000 },
  { month: "مارس", revenue: 361000, target: 220000 },
  { month: "أبريل", revenue: 290000, target: 230000 },
  { month: "مايو", revenue: 310000, target: 240000 },
  { month: "يونيو", revenue: 275000, target: 250000 },
  { month: "يوليو", revenue: 340000, target: 260000 },
  { month: "أغسطس", revenue: 295000, target: 270000 },
  { month: "سبتمبر", revenue: 320000, target: 280000 },
  { month: "أكتوبر", revenue: 380000, target: 290000 },
  { month: "نوفمبر", revenue: 330000, target: 300000 },
  { month: "ديسمبر", revenue: 371000, target: 310000 },
];

export const DEMO_FINANCE = {
  arr: 40800000,
  mrr: 3400000,
  profitMargin: 62,
  burnRate: 1300000,
  costs: [
    { label: "الرواتب", value: 55, color: "#00e5ff" },
    { label: "التقنية", value: 18, color: "#e040fb" },
    { label: "التسويق", value: 14, color: "#ffab00" },
    { label: "العمليات", value: 13, color: "#00e676" },
  ],
  monthly: [
    { month: "يناير", revenue: 3200000, expenses: 1250000 },
    { month: "فبراير", revenue: 3350000, expenses: 1280000 },
    { month: "مارس", revenue: 3500000, expenses: 1300000 },
    { month: "أبريل", revenue: 3300000, expenses: 1310000 },
    { month: "مايو", revenue: 3450000, expenses: 1290000 },
    { month: "يونيو", revenue: 3600000, expenses: 1340000 },
    { month: "يوليو", revenue: 3550000, expenses: 1320000 },
    { month: "أغسطس", revenue: 3400000, expenses: 1350000 },
    { month: "سبتمبر", revenue: 3700000, expenses: 1360000 },
    { month: "أكتوبر", revenue: 3650000, expenses: 1380000 },
    { month: "نوفمبر", revenue: 3800000, expenses: 1400000 },
    { month: "ديسمبر", revenue: 3900000, expenses: 1420000 },
  ],
};
