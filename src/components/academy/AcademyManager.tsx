"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchLearningStages,
  createLearningStage,
  updateLearningStage,
  deleteLearningStage,
  fetchLearningLessons,
  createLearningLesson,
  updateLearningLesson,
  deleteLearningLesson,
  fetchLearningQuizzes,
  createLearningQuiz,
  updateLearningQuiz,
  deleteLearningQuiz,
  seedLearningAcademy,
} from "@/lib/supabase/db";
import type { LearningStage, LearningLesson, LearningQuiz } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronRight, ChevronLeft, GraduationCap, BookOpen, HelpCircle, ArrowRight, Loader2 } from "lucide-react";

type View = "stages" | "lessons" | "quizzes";

export default function AcademyManager({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("stages");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Data
  const [stages, setStages] = useState<LearningStage[]>([]);
  const [lessons, setLessons] = useState<LearningLesson[]>([]);
  const [quizzes, setQuizzes] = useState<LearningQuiz[]>([]);

  // Selection
  const [selectedStage, setSelectedStage] = useState<LearningStage | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LearningLesson | null>(null);

  // Dialogs
  const [stageModal, setStageModal] = useState(false);
  const [lessonModal, setLessonModal] = useState(false);
  const [quizModal, setQuizModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form state
  const [stageForm, setStageForm] = useState({ title: "", icon: "📦", color: "#3B82F6", stage_number: 1 });
  const [lessonForm, setLessonForm] = useState({ title: "", duration: "10 د", points: "", task: "" });
  const [quizForm, setQuizForm] = useState({ question: "", options: "", correct_answer: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadStages();
  }, []);

  async function loadStages() {
    setLoading(true);
    try {
      const s = await fetchLearningStages();
      setStages(s);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadLessons(stageId: string) {
    setLoading(true);
    try {
      const l = await fetchLearningLessons(stageId);
      setLessons(l);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function loadQuizzes(lessonId: string) {
    setLoading(true);
    try {
      const q = await fetchLearningQuizzes(lessonId);
      setQuizzes(q);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // Seed
  async function handleSeed() {
    setSeeding(true);
    try {
      await seedLearningAcademy();
      await loadStages();
    } catch { /* ignore */ }
    setSeeding(false);
  }

  // Stage CRUD
  function openAddStage() {
    setEditingId(null);
    setStageForm({ title: "", icon: "📦", color: "#3B82F6", stage_number: stages.length + 1 });
    setStageModal(true);
  }

  function openEditStage(s: LearningStage) {
    setEditingId(s.id);
    setStageForm({ title: s.title, icon: s.icon, color: s.color, stage_number: s.stage_number });
    setStageModal(true);
  }

  async function saveStage() {
    if (!stageForm.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateLearningStage(editingId, stageForm);
        setStages(prev => prev.map(s => s.id === editingId ? updated : s));
      } else {
        const created = await createLearningStage({ ...stageForm, sort_order: stages.length + 1 });
        setStages(prev => [...prev, created]);
      }
      setStageModal(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  // Lesson CRUD
  function openAddLesson() {
    setEditingId(null);
    setLessonForm({ title: "", duration: "10 د", points: "", task: "" });
    setLessonModal(true);
  }

  function openEditLesson(l: LearningLesson) {
    setEditingId(l.id);
    setLessonForm({ title: l.title, duration: l.duration, points: (l.points || []).join("\n"), task: l.task || "" });
    setLessonModal(true);
  }

  async function saveLesson() {
    if (!lessonForm.title.trim() || !selectedStage) return;
    setSaving(true);
    try {
      const pointsArr = lessonForm.points.split("\n").filter(p => p.trim());
      const lessonKey = `${selectedStage.stage_number}-${lessons.length + 1}`;
      if (editingId) {
        const updated = await updateLearningLesson(editingId, {
          title: lessonForm.title,
          duration: lessonForm.duration,
          points: pointsArr,
          task: lessonForm.task || undefined,
        });
        setLessons(prev => prev.map(l => l.id === editingId ? updated : l));
      } else {
        const created = await createLearningLesson({
          stage_id: selectedStage.id,
          lesson_key: lessonKey,
          title: lessonForm.title,
          duration: lessonForm.duration,
          points: pointsArr,
          task: lessonForm.task || undefined,
          sort_order: lessons.length + 1,
        });
        setLessons(prev => [...prev, created]);
      }
      setLessonModal(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  // Quiz CRUD
  function openAddQuiz() {
    setEditingId(null);
    setQuizForm({ question: "", options: "", correct_answer: 0 });
    setQuizModal(true);
  }

  function openEditQuiz(q: LearningQuiz) {
    setEditingId(q.id);
    setQuizForm({ question: q.question, options: (q.options || []).join("\n"), correct_answer: q.correct_answer });
    setQuizModal(true);
  }

  async function saveQuiz() {
    if (!quizForm.question.trim() || !selectedLesson) return;
    setSaving(true);
    try {
      const optionsArr = quizForm.options.split("\n").filter(o => o.trim());
      if (editingId) {
        const updated = await updateLearningQuiz(editingId, {
          question: quizForm.question,
          options: optionsArr,
          correct_answer: quizForm.correct_answer,
        });
        setQuizzes(prev => prev.map(q => q.id === editingId ? updated : q));
      } else {
        const created = await createLearningQuiz({
          lesson_id: selectedLesson.id,
          question: quizForm.question,
          options: optionsArr,
          correct_answer: quizForm.correct_answer,
          sort_order: quizzes.length + 1,
        });
        setQuizzes(prev => [...prev, created]);
      }
      setQuizModal(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  // Delete
  async function handleDelete() {
    if (!deleteModal) return;
    try {
      if (deleteModal.type === "stage") {
        await deleteLearningStage(deleteModal.id);
        setStages(prev => prev.filter(s => s.id !== deleteModal.id));
      } else if (deleteModal.type === "lesson") {
        await deleteLearningLesson(deleteModal.id);
        setLessons(prev => prev.filter(l => l.id !== deleteModal.id));
      } else if (deleteModal.type === "quiz") {
        await deleteLearningQuiz(deleteModal.id);
        setQuizzes(prev => prev.filter(q => q.id !== deleteModal.id));
      }
    } catch { /* ignore */ }
    setDeleteModal(null);
  }

  // Navigation
  function goToLessons(stage: LearningStage) {
    setSelectedStage(stage);
    setView("lessons");
    loadLessons(stage.id);
  }

  function goToQuizzes(lesson: LearningLesson) {
    setSelectedLesson(lesson);
    setView("quizzes");
    loadQuizzes(lesson.id);
  }

  function goBack() {
    if (view === "quizzes") { setView("lessons"); setSelectedLesson(null); }
    else if (view === "lessons") { setView("stages"); setSelectedStage(null); }
    else onClose();
  }

  const ICON_OPTIONS = ["📦", "🎯", "🚀", "📚", "💡", "🔥", "⭐", "🏆", "📊", "🎓"];
  const COLOR_OPTIONS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#F97316"];

  return (
    <div dir="rtl" style={{ fontFamily: "inherit", color: "var(--foreground)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold">
              {view === "stages" && "إدارة المراحل"}
              {view === "lessons" && `دروس: ${selectedStage?.title}`}
              {view === "quizzes" && `اختبارات: ${selectedLesson?.title}`}
            </h2>
            <p className="text-xs text-muted-foreground">
              {view === "stages" && "أضف وعدّل مراحل الأكاديمية"}
              {view === "lessons" && "أضف وعدّل الدروس والمحتوى"}
              {view === "quizzes" && "أضف وعدّل أسئلة الاختبار"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === "stages" && stages.length === 0 && (
            <Button onClick={handleSeed} disabled={seeding} variant="outline" className="gap-1.5 text-xs">
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GraduationCap className="w-3.5 h-3.5" />}
              تحميل المحتوى الافتراضي
            </Button>
          )}
          <Button onClick={view === "stages" ? openAddStage : view === "lessons" ? openAddLesson : openAddQuiz} className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            {view === "stages" ? "مرحلة جديدة" : view === "lessons" ? "درس جديد" : "سؤال جديد"}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">جاري التحميل...</div>
      ) : (
        <>
          {/* Stages View */}
          {view === "stages" && (
            <div className="space-y-3">
              {stages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-2">لا توجد مراحل بعد</p>
                  <p className="text-xs">أضف مرحلة جديدة أو حمّل المحتوى الافتراضي</p>
                </div>
              ) : (
                stages.map(s => (
                  <div key={s.id} className="cc-card rounded-[14px] p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${s.color}18` }}>
                      {s.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">المرحلة {s.stage_number}: {s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">الترتيب: {s.sort_order}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => goToLessons(s)} title="الدروس">
                        <BookOpen className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditStage(s)} title="تعديل">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteModal({ type: "stage", id: s.id, name: s.title })} title="حذف" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Lessons View */}
          {view === "lessons" && (
            <div className="space-y-3">
              {lessons.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد دروس في هذه المرحلة</p>
                </div>
              ) : (
                lessons.map(l => (
                  <div key={l.id} className="cc-card rounded-[14px] p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{l.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {l.duration} • {(l.points || []).length} نقاط {l.task ? "• مهمة عملية" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => goToQuizzes(l)} title="الاختبارات">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditLesson(l)} title="تعديل">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteModal({ type: "lesson", id: l.id, name: l.title })} title="حذف" className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quizzes View */}
          {view === "quizzes" && (
            <div className="space-y-3">
              {quizzes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">لا توجد أسئلة في هذا الدرس</p>
                </div>
              ) : (
                quizzes.map((q, i) => (
                  <div key={q.id} className="cc-card rounded-[14px] p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{q.question}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(q.options || []).map((o, oi) => (
                            <span key={oi} className={`text-xs px-2.5 py-1 rounded-lg ${oi === q.correct_answer ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-white/[0.04] text-muted-foreground"}`}>
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditQuiz(q)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteModal({ type: "quiz", id: q.id, name: q.question })} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Stage Modal */}
      <Dialog open={stageModal} onOpenChange={setStageModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل المرحلة" : "إضافة مرحلة"}</DialogTitle>
            <DialogDescription>أدخل بيانات المرحلة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم المرحلة</Label>
              <Input value={stageForm.title} onChange={e => setStageForm(f => ({ ...f, title: e.target.value }))} placeholder="مثل: اعرف منتجك" />
            </div>
            <div className="space-y-1.5">
              <Label>رقم المرحلة</Label>
              <Input type="number" value={stageForm.stage_number} onChange={e => setStageForm(f => ({ ...f, stage_number: parseInt(e.target.value) || 1 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>الأيقونة</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} onClick={() => setStageForm(f => ({ ...f, icon: ic }))} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${stageForm.icon === ic ? "bg-white/[0.15] ring-2 ring-cyan/50" : "bg-white/[0.04] hover:bg-white/[0.08]"}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>اللون</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setStageForm(f => ({ ...f, color: c }))} className={`w-8 h-8 rounded-lg transition-all ${stageForm.color === c ? "ring-2 ring-white/50 scale-110" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageModal(false)}>إلغاء</Button>
            <Button onClick={saveStage} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Modal */}
      <Dialog open={lessonModal} onOpenChange={setLessonModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل الدرس" : "إضافة درس"}</DialogTitle>
            <DialogDescription>أدخل بيانات الدرس ونقاط المحتوى</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>عنوان الدرس</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} placeholder="مثل: المكالمة الأولى" />
            </div>
            <div className="space-y-1.5">
              <Label>المدة</Label>
              <Input value={lessonForm.duration} onChange={e => setLessonForm(f => ({ ...f, duration: e.target.value }))} placeholder="مثل: 15 د" />
            </div>
            <div className="space-y-1.5">
              <Label>نقاط المحتوى (كل سطر = نقطة)</Label>
              <Textarea value={lessonForm.points} onChange={e => setLessonForm(f => ({ ...f, points: e.target.value }))} placeholder="اكتب كل نقطة في سطر منفصل..." rows={5} />
            </div>
            <div className="space-y-1.5">
              <Label>المهمة العملية (اختياري)</Label>
              <Input value={lessonForm.task} onChange={e => setLessonForm(f => ({ ...f, task: e.target.value }))} placeholder="مثل: سوّ 3 مكالمات باردة..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonModal(false)}>إلغاء</Button>
            <Button onClick={saveLesson} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog open={quizModal} onOpenChange={setQuizModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل السؤال" : "إضافة سؤال"}</DialogTitle>
            <DialogDescription>أدخل السؤال والخيارات</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>السؤال</Label>
              <Input value={quizForm.question} onChange={e => setQuizForm(f => ({ ...f, question: e.target.value }))} placeholder="اكتب السؤال..." />
            </div>
            <div className="space-y-1.5">
              <Label>الخيارات (كل سطر = خيار)</Label>
              <Textarea value={quizForm.options} onChange={e => setQuizForm(f => ({ ...f, options: e.target.value }))} placeholder="اكتب كل خيار في سطر منفصل..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الإجابة الصحيحة (يبدأ من 0)</Label>
              <Input type="number" min={0} value={quizForm.correct_answer} onChange={e => setQuizForm(f => ({ ...f, correct_answer: parseInt(e.target.value) || 0 }))} />
              {quizForm.options && (
                <p className="text-xs text-muted-foreground mt-1">
                  الإجابة الصحيحة: {quizForm.options.split("\n").filter(o => o.trim())[quizForm.correct_answer] || "—"}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizModal(false)}>إلغاء</Button>
            <Button onClick={saveQuiz} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف &quot;{deleteModal?.name}&quot;؟ لا يمكن التراجع.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
