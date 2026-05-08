"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Home,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  TentTree,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

type RoomType = {
  id: string;
  name: string;
  category: string;
  capacity: number;
  unit_label?: string;
  is_active?: boolean;
};

type RoomUnit = {
  id: string;
  room_type_id: string;
  name: string;
  status: "AVAILABLE" | "MAINTENANCE" | "DISABLED" | string;
  created_at?: string;
  updated_at?: string;
  room_type?: RoomType | null;
};

type ApiResponse = {
  roomUnits?: RoomUnit[];
  rooms?: RoomType[];
  roomUnit?: RoomUnit;
  message?: string;
  error?: string;
};

const UI = {
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  orangeSoft: "#fff7ed",
  line: "#e8ddd0",
  muted: "#64748b",
  green: "#16a34a",
  greenSoft: "#ecfdf5",
  red: "#dc2626",
  redSoft: "#fff1f2",
  blueSoft: "#f8fafc",
  yellowSoft: "#fffbeb",
};

const emptyForm = {
  id: "",
  room_type_id: "",
  name: "",
  status: "AVAILABLE",
};

export default function AdminRoomUnitsPage() {
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function getToken() {
    if (typeof window === "undefined") return "admin-local-session";
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadData() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/room-units", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        alert(result.message || result.error || "โหลดข้อมูลยูนิตห้องไม่สำเร็จ");
        return;
      }

      setRoomUnits(result.roomUnits || []);
      setRooms(result.rooms || []);

      if (!form.room_type_id && result.rooms?.[0]?.id) {
        setForm((prev) => ({
          ...prev,
          room_type_id: result.rooms?.[0]?.id || "",
        }));
      }
    } catch (error) {
      console.error("LOAD_ROOM_UNITS_ERROR", error);
      alert("โหลดข้อมูลยูนิตห้องไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function saveUnit() {
    if (!form.room_type_id) {
      alert("กรุณาเลือกประเภทห้อง");
      return;
    }

    if (!form.name.trim()) {
      alert("กรุณากรอกชื่อยูนิตห้อง");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/room-units", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        alert(result.message || result.error || "บันทึกไม่สำเร็จ");
        return;
      }

      alert(form.id ? "อัปเดตยูนิตห้องสำเร็จ" : "เพิ่มยูนิตห้องสำเร็จ");

      setForm({
        ...emptyForm,
        room_type_id: rooms[0]?.id || "",
      });

      await loadData();
    } catch (error) {
      console.error("SAVE_ROOM_UNIT_ERROR", error);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function quickUpdateStatus(unit: RoomUnit, status: string) {
    try {
      const response = await fetch("/api/admin/room-units", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          id: unit.id,
          name: unit.name,
          status,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        alert(result.message || result.error || "อัปเดตสถานะไม่สำเร็จ");
        return;
      }

      await loadData();
    } catch (error) {
      console.error("QUICK_UPDATE_UNIT_ERROR", error);
      alert("อัปเดตสถานะไม่สำเร็จ");
    }
  }

  function editUnit(unit: RoomUnit) {
    setForm({
      id: unit.id,
      room_type_id: unit.room_type_id,
      name: unit.name,
      status: unit.status || "AVAILABLE",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      room_type_id: rooms[0]?.id || "",
    });
  }

  const filteredUnits = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    if (!key) return roomUnits;

    return roomUnits.filter((unit) => {
      return [
        unit.name,
        unit.status,
        unit.room_type?.name,
        unit.room_type?.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(key);
    });
  }, [keyword, roomUnits]);

  const availableCount = roomUnits.filter(
    (unit) => unit.status === "AVAILABLE"
  ).length;
  const maintenanceCount = roomUnits.filter(
    (unit) => unit.status === "MAINTENANCE"
  ).length;
  const disabledCount = roomUnits.filter(
    (unit) => unit.status === "DISABLED"
  ).length;

  return (
    <div className="grid gap-7">
      <section
        className="relative overflow-hidden rounded-[42px] border p-7 md:p-9"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #181818 56%, #321807 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: UI.orange }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                background: "rgba(249,115,22,0.13)",
                color: UI.orange,
                border: "1px solid rgba(249,115,22,0.35)",
              }}
            >
              <Home size={16} />
              Room Units
            </div>

            <h1 className="mt-5 text-4xl font-black md:text-5xl">
              จัดการยูนิตห้อง
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              เพิ่มจำนวนห้องจริง เช่น กระโจม 4 ท่าน 14 หลัง หรือรีสอร์ท 20 ห้อง
              เพื่อให้ระบบเช็กห้องว่างได้ถูกต้อง
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="ว่าง" value={availableCount} />
            <HeroStat label="ซ่อม" value={maintenanceCount} />
            <HeroStat label="ปิด" value={disabledCount} />
          </div>
        </div>
      </section>

      <section className="grid gap-7 xl:grid-cols-[420px_1fr]">
        <aside
          className="h-fit overflow-hidden rounded-[36px] border shadow-sm xl:sticky xl:top-24"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="border-b p-5"
            style={{
              borderColor: UI.line,
              background:
                "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ background: form.id ? UI.orange : UI.black }}
              >
                {form.id ? <Edit3 size={26} /> : <Plus size={28} />}
              </div>

              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.2em]"
                  style={{ color: UI.orange }}
                >
                  {form.id ? "Edit Unit" : "Create Unit"}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {form.id ? "แก้ไขยูนิต" : "เพิ่มยูนิตใหม่"}
                </h2>
                <p className="text-sm font-semibold" style={{ color: UI.muted }}>
                  ใช้สำหรับนับจำนวนห้องจริง
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            <label>
              <p className="mb-2 text-sm font-black">ประเภทห้อง</p>
              <select
                value={form.room_type_id}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    room_type_id: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none"
                style={{ borderColor: UI.line }}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm font-black">ชื่อยูนิตห้อง</p>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="เช่น TENT-401 / RESORT-01"
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none"
                style={{ borderColor: UI.line }}
              />
            </label>

            <label>
              <p className="mb-2 text-sm font-black">สถานะ</p>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none"
                style={{ borderColor: UI.line }}
              >
                <option value="AVAILABLE">ว่าง / เปิดใช้งาน</option>
                <option value="MAINTENANCE">ซ่อมบำรุง</option>
                <option value="DISABLED">ปิดใช้งาน</option>
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={saveUnit}
                disabled={saving}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{
                  background: UI.orange,
                  boxShadow: "0 14px 32px rgba(249,115,22,0.20)",
                }}
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {form.id ? "บันทึก" : "เพิ่มยูนิต"}
              </button>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                    color: UI.black,
                  }}
                >
                  <X size={18} />
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </aside>

        <section
          className="overflow-hidden rounded-[36px] border shadow-sm"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="border-b p-5"
            style={{
              borderColor: UI.line,
              background:
                "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: UI.orange }}
                >
                  Unit List
                </p>
                <h2 className="mt-2 text-3xl font-black">รายการยูนิตห้อง</h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label
                  className="flex h-12 w-full items-center gap-3 rounded-2xl border px-4 sm:min-w-[300px]"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                  }}
                >
                  <Search size={18} color={UI.orange} />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="ค้นหายูนิต / ประเภทห้อง"
                    className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                  />
                </label>

                <button
                  type="button"
                  onClick={loadData}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                    color: UI.black,
                  }}
                >
                  <RefreshCcw size={18} />
                  รีเฟรช
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  className="mx-auto animate-spin"
                  size={48}
                  color={UI.orange}
                />
                <p className="mt-4 text-2xl font-black">กำลังโหลดข้อมูล</p>
              </div>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center p-6 text-center">
              <div>
                <Home className="mx-auto" size={56} color={UI.orange} />
                <h3 className="mt-5 text-3xl font-black">ยังไม่มียูนิตห้อง</h3>
                <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
                  เพิ่มยูนิตใหม่จากฟอร์มด้านซ้าย
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-5">
              {filteredUnits.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  onEdit={() => editUnit(unit)}
                  onStatusChange={(status) => quickUpdateStatus(unit, status)}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
      <p className="text-sm font-black text-white/55">{label}</p>
      <p className="mt-2 text-4xl font-black" style={{ color: UI.orange }}>
        {value}
      </p>
    </div>
  );
}

function UnitCard({
  unit,
  onEdit,
  onStatusChange,
}: {
  unit: RoomUnit;
  onEdit: () => void;
  onStatusChange: (status: string) => void;
}) {
  const badge = getStatusBadge(unit.status);

  return (
    <article
      className="rounded-[30px] border p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: UI.paper,
        borderColor: UI.line,
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_220px_220px] lg:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
              style={{
                background: badge.bg,
                color: badge.color,
              }}
            >
              {badge.icon}
              {badge.label}
            </span>

            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
              style={{
                background: UI.orangeSoft,
                color: UI.orange,
              }}
            >
              <TentTree size={14} />
              {unit.room_type?.name || "ไม่พบประเภทห้อง"}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black">{unit.name}</h3>

          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            รองรับ {unit.room_type?.capacity || "-"} คน /{" "}
            {unit.room_type?.unit_label || "ห้อง"}
          </p>
        </div>

        <select
          value={unit.status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-12 rounded-2xl border px-4 text-sm font-bold outline-none"
          style={{ borderColor: UI.line }}
        >
          <option value="AVAILABLE">ว่าง / เปิดใช้งาน</option>
          <option value="MAINTENANCE">ซ่อมบำรุง</option>
          <option value="DISABLED">ปิดใช้งาน</option>
        </select>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white"
          style={{
            background: UI.orange,
            boxShadow: "0 14px 32px rgba(249,115,22,0.18)",
          }}
        >
          <Edit3 size={18} />
          แก้ไข
        </button>
      </div>
    </article>
  );
}

function getStatusBadge(status: string) {
  if (status === "AVAILABLE") {
    return {
      label: "ว่าง / เปิดใช้งาน",
      bg: UI.greenSoft,
      color: UI.green,
      icon: <CheckCircle2 size={14} />,
    };
  }

  if (status === "MAINTENANCE") {
    return {
      label: "ซ่อมบำรุง",
      bg: UI.yellowSoft,
      color: UI.orange,
      icon: <Wrench size={14} />,
    };
  }

  return {
    label: "ปิดใช้งาน",
    bg: UI.redSoft,
    color: UI.red,
    icon: <XCircle size={14} />,
  };
}