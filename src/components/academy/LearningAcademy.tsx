"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchLearningProgress,
  saveLearningProgress,
  fetchLearningStages,
  fetchLearningLessons,
  fetchLearningQuizzes,
} from "@/lib/supabase/db";
import type { LearningStage, LearningLesson, LearningQuiz } from "@/types";
import AcademyManager from "./AcademyManager";

/* ─── Unified types for rendering ─── */

interface QuizQuestion {
  q: string;
  opts: string[];
  a: number;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  points: string[];
  quiz: QuizQuestion[];
  task?: string;
}

interface Stage {
  id: number;
  title: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

/* ─── Fallback hardcoded data ─── */

const FALLBACK_STAGES: Stage[] = [
  {
    id: 1, title: "اعرف منتجك", icon: "📦", color: "#3B82F6",
    lessons: [
      { id: "1-1", title: "منظومة MENU الكاملة", duration: "15 د", points: ["المنيو الإلكتروني: QR → قائمة تفاعلية → طلب للمطبخ", "نظام الكاشير: طلبات + فواتير + تقارير", "نحجز: حجز طاولات + ولاء رقمي بدون تطبيق", "درع: حماية المطعم من خسائر التوصيل والغرامات"], quiz: [{ q: "ما الميزة الأقوى اللي تفرقنا عن المنافسين؟", opts: ["السعر الأرخص", "المنظومة المتكاملة", "التصميم", "عدد الموظفين"], a: 1 }, { q: "وش يسوي درع للمطعم؟", opts: ["تصميم منيو", "يحمي من خسائر التوصيل", "يوظف سائقين", "يصور الأكل"], a: 1 }] },
      { id: "1-2", title: "مين عميلك؟", duration: "10 د", points: ["صاحب مطعم صغير (1-3 فروع): يبي حل بسيط وسعر معقول", "مدير عمليات سلسلة (5+ فروع): يبي تقارير مركزية", "مطعم جديد: يحتاج كل شيء من الصفر — أسهل عميل", "نقاط الألم: فوضى الطلبات، خسائر التوصيل، ما عنده بيانات"], quiz: [{ q: "أي عميل الأسهل في الإغلاق؟", opts: ["السلاسل الكبيرة", "اللي عنده نظام ثاني", "المطعم الجديد أو بدون نظام"], a: 2 }] },
    ],
  },
  {
    id: 2, title: "تعلّم تبيع", icon: "🎯", color: "#8B5CF6",
    lessons: [
      { id: "2-1", title: "المكالمة الأولى", duration: "15 د", points: ["أول 10 ثواني تحدد كل شيء — لا تبدأ ببيع، ابدأ بسؤال", "الافتتاحية: 'كيف تدير طلباتك حالياً؟' بدل 'عندنا نظام ممتاز'", "الهدف: لا تبيع بالتلفون — خذ موعد زيارة أو عرض", "التعامل مع 'مو مهتم': 'تمام، بس سؤال سريع وش تستخدم حالياً؟'"], quiz: [{ q: "وش أفضل افتتاحية لمكالمة باردة؟", opts: ["عندنا عرض خاص", "سؤال عن مشكلته الحالية", "تعريف بالشركة", "ذكر السعر"], a: 1 }, { q: "وش هدف المكالمة الأولى؟", opts: ["إغلاق البيع", "أخذ موعد عرض", "إرسال عرض سعر", "إضافته بالواتساب"], a: 1 }], task: "سوّ 3 مكالمات باردة وسجّل النتائج" },
      { id: "2-2", title: "لما العميل يعترض", duration: "15 د", points: ["'غالي' → 'خليني أوريك كم تخسر شهرياً بدون نظام'", "'عندنا نظام' → 'وش الأشياء اللي تتمنى تتحسن فيه؟'", "'مو الوقت' → حدد موعد + أرسل محتوى قيمة", "'أحتاج أفكر' → 'تمام، نتواصل يوم الأحد؟' — دايم حدد تاريخ"], quiz: [{ q: "العميل يقول 'غالي'، وش أفضل رد؟", opts: ["نعطيك خصم", "أوريك كم توفر شهرياً", "ما عندنا أرخص", "مافي حل"], a: 1 }, { q: "العميل يقول 'أفكر فيها'، وش تسوي؟", opts: ["تنتظر يرد", "تحدد موعد متابعة", "تتجاهله", "ترسل عرض ثاني"], a: 1 }], task: "سجّل 3 اعتراضات واجهتها وكيف رديت عليها" },
      { id: "2-3", title: "أغلق الصفقة", duration: "10 د", points: ["اقرأ إشارات الشراء: يسأل عن السعر، التفعيل، التفاصيل = جاهز", "إغلاق الافتراض: 'نبدأ بالباقة السنوية ولا نجرب شهري؟'", "لا تخصم — أضف قيمة: شهر مجاني، تدريب إضافي", "بعد الإغلاق: فعّل فوراً + تابع أول أسبوع"], quiz: [{ q: "العميل يطلب خصم، وش الأفضل؟", opts: ["تعطيه خصم", "تضيف قيمة بدل الخصم", "ترفض", "ترجع للمدير"], a: 1 }] },
    ],
  },
  {
    id: 3, title: "كبّر الصفقة", icon: "🚀", color: "#10B981",
    lessons: [
      { id: "3-1", title: "فن الـ Upsell", duration: "10 د", points: ["المسار: ابدأ بـ MENU → بعد شهر نجاح اعرض نحجز → ثم درع", "لا تعرض كل شيء مرة وحدة — انتظر ما ينجح أول منتج", "استخدم أرقام حقيقية: 'عميل مشابه وفّر X ريال بعد إضافة درع'", "الحزمة الكاملة: اعرضها بسعر مخفض للعملاء الجادين"], quiz: [{ q: "متى أفضل وقت تعرض منتج إضافي؟", opts: ["أول يوم", "بعد شهر نجاح", "بعد سنة", "ما تعرض"], a: 1 }] },
      { id: "3-2", title: "Pipeline صحي", duration: "10 د", points: ["قاعدة 3x: دايم حافظ على 3 أضعاف هدفك في الـ Pipeline", "كل أسبوع: حرّك الصفقات الراكدة أو احذفها", "60% وقتك استقطاب جديد، 30% متابعة، 10% إداري", "التجديدات: ابدأ قبل 60 يوم من انتهاء الاشتراك"], quiz: [{ q: "كم نسبة وقتك المفروض للاستقطاب الجديد؟", opts: ["30%", "40%", "60%", "80%"], a: 2 }] },
    ],
  },
];

/* ─── Quiz Component ─── */

function Quiz({ questions, color, onDone }: { questions: QuizQuestion[]; color: string; onDone: (ok: boolean) => void }) {
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [right, setRight] = useState(0);
  const [done, setDone] = useState(false);
  const cur = questions[idx];

  const select = (i: number) => {
    if (shown) return;
    setPick(i); setShown(true);
    if (i === cur.a) setRight(r => r + 1);
  };

  const next = () => {
    if (idx + 1 < questions.length) { setIdx(i => i + 1); setPick(null); setShown(false); }
    else setDone(true);
  };

  if (done) {
    const ok = right / questions.length >= 0.7;
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>{ok ? "✅" : "🔄"}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--foreground)", marginBottom: 4 }}>{ok ? "أحسنت!" : "حاول مرة ثانية"}</div>
        <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 18 }}>{right}/{questions.length} صح</div>
        <button onClick={() => onDone(ok)} style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          {ok ? "التالي ←" : "إعادة"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 12 }}>{idx + 1}/{questions.length}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)", marginBottom: 14, lineHeight: 1.7 }}>{cur.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cur.opts.map((o, i) => {
          let bg = "rgba(255,255,255,.05)", bd = "1px solid rgba(255,255,255,.07)";
          if (shown && i === cur.a) { bg = "rgba(16,185,129,.15)"; bd = "1px solid #10B981"; }
          else if (shown && i === pick) { bg = "rgba(239,68,68,.15)"; bd = "1px solid #EF4444"; }
          return <button key={i} onClick={() => select(i)} style={{ background: bg, border: bd, borderRadius: 10, padding: "11px 14px", textAlign: "right", color: "var(--foreground)", fontSize: 14, cursor: shown ? "default" : "pointer", fontFamily: "inherit" }}>{o}</button>;
        })}
      </div>
      {shown && <button onClick={next} style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: 14 }}>{idx + 1 < questions.length ? "التالي" : "النتيجة"}</button>}
    </div>
  );
}

/* ─── Exported helpers (used by team page and weekly meeting) ─── */

export function getAcademyStats(completedLessons: string[], stages?: Stage[]) {
  const stgs = stages && stages.length > 0 ? stages : FALLBACK_STAGES;
  const total = stgs.reduce((s, st) => s + st.lessons.length, 0);
  const completed = completedLessons.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  let currentStage = "";
  for (const stage of stgs) {
    const allDone = stage.lessons.every(l => completedLessons.includes(l.id));
    if (!allDone) { currentStage = stage.title; break; }
  }
  if (!currentStage && completed === total) currentStage = "مكتمل";

  const lastLesson = completedLessons.length > 0 ? completedLessons[completedLessons.length - 1] : null;
  let lastLessonName = "";
  if (lastLesson) {
    for (const stage of stgs) {
      const found = stage.lessons.find(l => l.id === lastLesson);
      if (found) { lastLessonName = found.title; break; }
    }
  }

  return { total, completed, pct, currentStage, lastLessonName };
}

export const TOTAL_LESSONS = FALLBACK_STAGES.reduce((s, st) => s + st.lessons.length, 0);
export const STAGES = FALLBACK_STAGES;

/* ─── Main Component ─── */

export default function LearningAcademy() {
  const { user } = useAuth();
  const [dynamicStages, setDynamicStages] = useState<Stage[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stg, setStg] = useState<number | null>(null);
  const [les, setLes] = useState<string | null>(null);
  const [quiz, setQuiz] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  const isAdmin = user?.isSuperAdmin || user?.roleName === "مدير" || user?.roleName === "admin";

  // Load content from Supabase, fallback to hardcoded
  useEffect(() => {
    async function loadContent() {
      try {
        const [dbStages, dbLessons, dbQuizzes] = await Promise.all([
          fetchLearningStages(),
          fetchLearningLessons(),
          fetchLearningQuizzes(),
        ]);

        if (dbStages.length > 0) {
          const mapped: Stage[] = dbStages
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(s => {
              const stageLessons = dbLessons
                .filter(l => l.stage_id === s.id)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(l => {
                  const lessonQuizzes = dbQuizzes
                    .filter(q => q.lesson_id === l.id)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(q => ({ q: q.question, opts: q.options || [], a: q.correct_answer }));
                  return {
                    id: l.lesson_key,
                    title: l.title,
                    duration: l.duration,
                    points: l.points || [],
                    quiz: lessonQuizzes,
                    task: l.task,
                  };
                });
              return {
                id: s.stage_number,
                title: s.title,
                icon: s.icon,
                color: s.color,
                lessons: stageLessons,
              };
            });
          setDynamicStages(mapped);
        }
      } catch { /* fallback to hardcoded */ }
    }
    loadContent();
  }, [adminMode]); // reload when leaving admin mode

  // Load progress
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchLearningProgress(user.id)
      .then((lessons) => setDone(lessons))
      .catch(() => setDone([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const saveProgress = useCallback(async (lessons: string[]) => {
    setDone(lessons);
    if (user?.id) {
      try { await saveLearningProgress(user.id, lessons); } catch { /* silent */ }
    }
  }, [user?.id]);

  const mark = (id: string) => {
    if (!done.includes(id)) saveProgress([...done, id]);
    setQuiz(false);
  };

  // Use dynamic stages if available, otherwise fallback
  const activeStages = dynamicStages.length > 0 ? dynamicStages : FALLBACK_STAGES;
  const totalLessons = activeStages.reduce((s, st) => s + st.lessons.length, 0);
  const pct = totalLessons > 0 ? Math.round((done.length / totalLessons) * 100) : 0;
  const stage = stg ? activeStages.find(s => s.id === stg) : null;
  const lesson = les && stage ? stage.lessons.find(l => l.id === les) : null;

  // Admin mode
  if (adminMode) {
    return <AcademyManager onClose={() => setAdminMode(false)} />;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ color: "var(--muted-foreground)", fontSize: 14 }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: "inherit", color: "var(--foreground)" }}>
      {/* Header */}
      <div style={{ padding: "24px 0 18px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>🎓 أكاديمية المبيعات</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isAdmin && (
              <button
                onClick={() => setAdminMode(true)}
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                تعديل المحتوى
              </button>
            )}
            <div style={{ background: "rgba(16,185,129,.12)", borderRadius: 8, padding: "6px 14px", fontSize: 15, fontWeight: 800, color: "#10B981" }}>{pct}%</div>
          </div>
        </div>
        <div style={{ marginTop: 12, background: "rgba(255,255,255,.06)", borderRadius: 50, height: 5, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 50, background: "linear-gradient(90deg,#3B82F6,#8B5CF6,#10B981)", transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 6 }}>{done.length}/{totalLessons} درس</div>
      </div>

      <div style={{ padding: "18px 0 40px" }}>

        {/* ─ درس ─ */}
        {lesson && stage ? (
          <div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 18, fontSize: 13, color: "var(--muted-foreground)" }}>
              <span onClick={() => { setLes(null); setQuiz(false); }} style={{ cursor: "pointer", color: stage.color }}>{stage.icon} {stage.title}</span>
              <span>‹</span>
              <span style={{ color: "var(--muted-foreground)" }}>{lesson.title}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 14, padding: 20, border: `1px solid ${stage.color}20` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{lesson.title}</h2>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>⏱ {lesson.duration}</span>
              </div>
              {!quiz ? (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                    {lesson.points.map((p, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,.04)", borderRadius: 10, padding: "12px 14px", borderRight: `3px solid ${stage.color}`, fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.7 }}>{p}</div>
                    ))}
                  </div>
                  {lesson.task && (
                    <div style={{ background: `${stage.color}0d`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--muted-foreground)", marginBottom: 18, border: `1px dashed ${stage.color}33` }}>
                      🎬 <strong style={{ color: "var(--foreground)" }}>مهمة:</strong> {lesson.task}
                    </div>
                  )}
                  {done.includes(lesson.id)
                    ? <div style={{ textAlign: "center", color: "#10B981", fontSize: 14, fontWeight: 600, padding: 8 }}>✅ مكتمل</div>
                    : <button onClick={() => setQuiz(true)} style={{ background: stage.color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "100%", minHeight: 44 }}>ابدأ الاختبار ←</button>
                  }
                </>
              ) : (
                <Quiz questions={lesson.quiz} color={stage.color} onDone={(ok) => { if (ok) mark(lesson.id); else setQuiz(false); }} />
              )}
            </div>
          </div>

        /* ─ دروس المرحلة ─ */
        ) : stage ? (
          <div>
            <button onClick={() => setStg(null)} style={{ background: "none", border: "none", color: "var(--muted-foreground)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, marginBottom: 14 }}>→ الرجوع</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${stage.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{stage.icon}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{stage.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{stage.lessons.filter(l => done.includes(l.id)).length}/{stage.lessons.length}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stage.lessons.map(l => {
                const ok = done.includes(l.id);
                return (
                  <div key={l.id} onClick={() => setLes(l.id)} style={{ background: "rgba(255,255,255,.04)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,.05)", minHeight: 56 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: ok ? "#10B981" : `${stage.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{ok ? "✓" : "📖"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{l.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{l.duration} • {l.quiz.length} أسئلة</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        /* ─ المراحل ─ */
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeStages.map((s, i) => {
              const d = s.lessons.filter(l => done.includes(l.id)).length;
              const t = s.lessons.length;
              const p = t > 0 ? Math.round((d / t) * 100) : 0;
              const locked = i > 0 && !activeStages[i - 1].lessons.every(l => done.includes(l.id));
              return (
                <div key={s.id} onClick={!locked ? () => setStg(s.id) : undefined} style={{
                  background: locked ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.04)",
                  borderRadius: 14, padding: "18px 20px", cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.35 : 1, display: "flex", alignItems: "center", gap: 16,
                  border: "1px solid rgba(255,255,255,.05)", minHeight: 72,
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{locked ? "🔒" : s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>المرحلة {s.id}: {s.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "rgba(255,255,255,.07)", borderRadius: 50, height: 4, overflow: "hidden" }}>
                        <div style={{ width: `${p}%`, height: "100%", background: s.color, borderRadius: 50 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{d}/{t}</span>
                    </div>
                  </div>
                  {p === 100 && <span>✅</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
