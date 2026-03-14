"use client";

import { useState, useEffect } from "react";
import type { Deal } from "@/types";
import { fetchDeals, createDeal, updateDeal, deleteDeal } from "@/lib/supabase/db";
import { STAGES, SOURCES } from "@/lib/utils/constants";
import { formatMoneyFull, formatDate, formatPhone, formatPercent } from "@/lib/utils/format";
import { StatCard } from "@/components/ui/stat-card";
import { ColorBadge } from "@/components/ui/color-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Megaphone,
  BarChart3,
  Handshake,
  Heart,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

/* ─── Stage badge color mapping ─── */
const STAGE_BADGE_COLOR: Record<string, "green" | "amber" | "purple" | "cyan" | "red"> = {
  "تواصل": "green",
  "عرض سعر": "amber",
  "تفاوض": "purple",
  "إغلاق": "cyan",
  "خسارة": "red",
};

/* ─── Source card config (the 4 shown at top) ─── */
const SOURCE_CARDS: {
  key: string;
  color: "cyan" | "green" | "amber" | "purple";
  icon: React.ReactNode;
}[] = [
  { key: "إعلانات", color: "cyan", icon: <Megaphone className="w-4 h-4 text-cyan" /> },
  { key: "تسويق", color: "green", icon: <BarChart3 className="w-4 h-4 text-cc-green" /> },
  { key: "شراكة", color: "purple", icon: <Handshake className="w-4 h-4 text-cc-purple" /> },
  { key: "توصية", color: "amber", icon: <Heart className="w-4 h-4 text-amber" /> },
];

/* ─── Empty deal form shape ─── */
const EMPTY_FORM = {
  client_name: "",
  client_phone: "",
  deal_value: 0,
  assigned_rep_name: "",
  source: "إعلانات",
  stage: "تواصل",
  deal_date: new Date().toISOString().slice(0, 10),
  probability: 50,
};

export default function SalesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  /* modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  /* delete confirmation */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals()
      .then(setDeals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ─── Source distribution ─── */
  const sourceCounts = deals.reduce<Record<string, number>>((acc, d) => {
    if (d.source) acc[d.source] = (acc[d.source] || 0) + 1;
    return acc;
  }, {});
  const totalDeals = deals.length;

  /* ─── Handlers ─── */
  function openAddModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEditModal(deal: Deal) {
    setEditingId(deal.id);
    setForm({
      client_name: deal.client_name,
      client_phone: deal.client_phone || "",
      deal_value: deal.deal_value,
      assigned_rep_name: deal.assigned_rep_name || "",
      source: deal.source || "إعلانات",
      stage: deal.stage,
      deal_date: deal.deal_date || new Date().toISOString().slice(0, 10),
      probability: deal.probability,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.client_name.trim()) return;
    setSaving(true);
    try {
      const dealDate = form.deal_date;
      const month = new Date(dealDate).getMonth() + 1;
      const year = new Date(dealDate).getFullYear();

      if (editingId) {
        const updated = await updateDeal(editingId, {
          client_name: form.client_name,
          client_phone: form.client_phone,
          deal_value: form.deal_value,
          assigned_rep_name: form.assigned_rep_name,
          source: form.source,
          stage: form.stage,
          deal_date: form.deal_date,
          probability: form.probability,
        });
        setDeals((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
      } else {
        const created = await createDeal({
          client_name: form.client_name,
          client_phone: form.client_phone,
          deal_value: form.deal_value,
          assigned_rep_name: form.assigned_rep_name,
          source: form.source,
          stage: form.stage,
          deal_date: form.deal_date,
          probability: form.probability,
          cycle_days: 0,
          month,
          year,
        });
        setDeals((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (deleteId) {
      try {
        await deleteDeal(deleteId);
        setDeals((prev) => prev.filter((d) => d.id !== deleteId));
      } catch (err) {
        console.error(err);
      }
    }
    setDeleteOpen(false);
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">المبيعات</h1>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4" data-icon="inline-start" />
          إضافة صفقة
        </Button>
      </div>

      {/* ─── Source Distribution Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SOURCE_CARDS.map((sc) => {
          const count = sourceCounts[sc.key] || 0;
          const pct = totalDeals > 0 ? Math.round((count / totalDeals) * 100) : 0;
          return (
            <StatCard
              key={sc.key}
              value={String(count)}
              label={sc.key}
              color={sc.color}
              progress={pct}
              icon={sc.icon}
              subtext={formatPercent(pct) + " من الصفقات"}
            />
          );
        })}
      </div>

      {/* ─── Deals Table ─── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الجوال</TableHead>
              <TableHead>المصدر</TableHead>
              <TableHead>القيمة</TableHead>
              <TableHead>المرحلة</TableHead>
              <TableHead className="min-w-[120px]">الاحتمالية</TableHead>
              <TableHead>المسؤول</TableHead>
              <TableHead className="text-center">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  لا توجد صفقات
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium text-foreground">
                    {deal.client_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {deal.deal_date ? formatDate(deal.deal_date) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono" dir="ltr">
                    {deal.client_phone ? formatPhone(deal.client_phone) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {deal.source || "—"}
                  </TableCell>
                  <TableCell className="font-bold text-cyan text-xs">
                    {formatMoneyFull(deal.deal_value)}
                  </TableCell>
                  <TableCell>
                    <ColorBadge
                      text={deal.stage}
                      color={STAGE_BADGE_COLOR[deal.stage] || "blue"}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-cyan transition-all"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-left" dir="ltr">
                        {deal.probability}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {deal.assigned_rep_name || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditModal(deal)}
                        title="تعديل"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => confirmDelete(deal.id)}
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Add / Edit Deal Modal ─── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "تعديل صفقة" : "إضافة صفقة جديدة"}</DialogTitle>
            <DialogDescription>
              {editingId ? "قم بتحديث بيانات الصفقة" : "أدخل بيانات الصفقة الجديدة"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Client name */}
            <div className="grid gap-1.5">
              <Label htmlFor="client_name">اسم العميل</Label>
              <Input
                id="client_name"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="أدخل اسم العميل"
              />
            </div>

            {/* Phone + Value row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="client_phone">رقم الجوال</Label>
                <Input
                  id="client_phone"
                  value={form.client_phone}
                  onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="deal_value">القيمة ($)</Label>
                <Input
                  id="deal_value"
                  type="number"
                  value={form.deal_value || ""}
                  onChange={(e) =>
                    setForm({ ...form, deal_value: Number(e.target.value) || 0 })
                  }
                  placeholder="0"
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>

            {/* Rep + Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="assigned_rep_name">المسؤول</Label>
                <Input
                  id="assigned_rep_name"
                  value={form.assigned_rep_name}
                  onChange={(e) => setForm({ ...form, assigned_rep_name: e.target.value })}
                  placeholder="اسم المسؤول"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="deal_date">التاريخ</Label>
                <Input
                  id="deal_date"
                  type="date"
                  value={form.deal_date}
                  onChange={(e) => setForm({ ...form, deal_date: e.target.value })}
                  dir="ltr"
                  className="text-right"
                />
              </div>
            </div>

            {/* Source (radio buttons) */}
            <div className="grid gap-1.5">
              <Label>المصدر</Label>
              <div className="flex flex-wrap gap-2">
                {SOURCES.map((src) => (
                  <label
                    key={src}
                    className={`flex items-center gap-1.5 cursor-pointer rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      form.source === src
                        ? "border-cyan bg-cyan-dim text-cyan"
                        : "border-border text-muted-foreground hover:border-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="source"
                      value={src}
                      checked={form.source === src}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="sr-only"
                    />
                    {src}
                  </label>
                ))}
              </div>
            </div>

            {/* Stage (dropdown) */}
            <div className="grid gap-1.5">
              <Label>المرحلة</Label>
              <Select value={form.stage} onValueChange={(val) => val && setForm({ ...form, stage: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المرحلة" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stg) => (
                    <SelectItem key={stg} value={stg}>
                      {stg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Probability slider */}
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="probability">احتمالية الإغلاق</Label>
                <span className="text-xs font-bold text-cyan">{form.probability}%</span>
              </div>
              <input
                id="probability"
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-cyan [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الصفقة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه الصفقة؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              حذف الصفقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
