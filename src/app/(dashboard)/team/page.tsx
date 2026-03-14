"use client";

import { useState, useEffect } from "react";
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/lib/supabase/db";
import { EMPLOYEE_STATUSES } from "@/lib/utils/constants";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/types";
import { Users, UserPlus, Pencil, Trash2 } from "lucide-react";

/* ---------- helpers ---------- */

const STATUS_COLOR: Record<string, "green" | "amber" | "blue" | "red"> = {
  "نشط": "green",
  "مشغول": "amber",
  "متاح": "blue",
  "غير نشط": "red",
};

function workloadColor(pct: number): string {
  if (pct > 85) return "bg-cc-red";
  if (pct >= 60) return "bg-amber";
  return "bg-cc-green";
}

function workloadTextColor(pct: number): string {
  if (pct > 85) return "text-cc-red";
  if (pct >= 60) return "text-amber";
  return "text-cc-green";
}

/* ---------- page ---------- */

export default function TeamPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  /* form state */
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState<string>("نشط");

  useEffect(() => {
    fetchEmployees()
      .then(setEmployees)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormName("");
    setFormRole("");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("نشط");
    setModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormRole(emp.role || "");
    setFormEmail(emp.email || "");
    setFormPhone(emp.phone || "");
    setFormStatus(emp.status);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingEmployee) {
        const updated = await updateEmployee(editingEmployee.id, {
          name: formName,
          role: formRole,
          email: formEmail,
          phone: formPhone,
          status: formStatus,
        });
        setEmployees((prev) =>
          prev.map((e) => (e.id === editingEmployee.id ? updated : e))
        );
      } else {
        const created = await createEmployee({
          name: formName,
          role: formRole,
          email: formEmail,
          phone: formPhone,
          status: formStatus,
        });
        setEmployees((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /* counts */
  const activeCount = employees.filter((e) => e.status === "نشط").length;
  const busyCount = employees.filter((e) => e.status === "مشغول").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-dim flex items-center justify-center">
            <Users className="w-4 h-4 text-cyan" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {employees.length} عضو في الفريق
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeCount} نشط &bull; {busyCount} مشغول
            </p>
          </div>
        </div>
        <Button onClick={openAddModal} className="gap-1.5">
          <UserPlus className="w-4 h-4" />
          إضافة عضو
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={String(employees.length)}
          label="إجمالي الفريق"
          color="cyan"
          icon={<Users className="w-4 h-4 text-cyan" />}
        />
        <StatCard
          value={String(activeCount)}
          label="أعضاء نشطين"
          color="green"
        />
        <StatCard
          value={String(busyCount)}
          label="مشغول"
          color="amber"
        />
        <StatCard
          value={String(employees.filter((e) => e.status === "غير نشط").length)}
          label="غير نشط"
          color="red"
        />
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const workload = 0;
            const initial = emp.name.charAt(0);

            return (
              <div
                key={emp.id}
                className="bg-card rounded-xl border border-border p-5 space-y-4"
              >
                {/* Top: avatar + info */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-cyan bg-cyan-dim flex items-center justify-center text-cyan font-bold text-base shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.role}
                    </p>
                  </div>
                  <ColorBadge
                    text={emp.status}
                    color={STATUS_COLOR[emp.status] || "blue"}
                  />
                </div>

                {/* Workload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground">حمل العمل</span>
                    <span className={`text-xs font-bold ${workloadTextColor(workload)}`}>
                      {workload}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${workloadColor(workload)}`}
                      style={{ width: `${workload}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => openEditModal(emp)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1 text-xs"
                    onClick={() => handleDelete(emp.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </Button>
                </div>
              </div>
            );
          })}
          {employees.length === 0 && (
            <div className="col-span-3 text-center text-muted-foreground py-12">
              لا يوجد أعضاء في الفريق
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "تعديل العضو" : "إضافة عضو جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>الاسم</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="اسم العضو"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الدور</Label>
              <Input
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                placeholder="المسمى الوظيفي"
              />
            </div>

            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="example@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الجوال</Label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الحالة</Label>
              <Select value={formStatus} onValueChange={(v) => v && setFormStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : editingEmployee ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
