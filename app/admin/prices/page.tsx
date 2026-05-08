"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  WalletCards,
  X,
} from "lucide-react";

type RoomType = {
  id: string;
  name: string;
  category: string;
  capacity: number;
  unit_label?: string;
};

type Rate = {
  id: string;
  room_type_id: string;
  day_type: "WEEKDAY" | "WEEKEND" | string;
  price_per_person: number;
  created_at?: string;
  updated_at?: string;
  room_type?: RoomType | null;
};

type ApiResponse = {
  rates?: Rate[];
  rooms?: RoomType[];
  rate?: Rate;
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
  blueSoft: "#f8fafc",
};

const emptyForm = {
  id: "",
  room_type_id: "",
  day_type: "WEEKDAY",
  price_per_person: 0,
};

export default function AdminPricesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
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
      const response = await fetch("/api/admin/rates", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        alert(result.message || result.error || "โหลดข้อมูลราคาไม่สำเร็จ");
        return;
      }

      setRates(result.rates || []);
      setRooms(result.rooms || []);

      if (!form.room_type_id && result.rooms?.[0]?.id) {
        setForm((prev) => ({
          ...prev,
          room_type_id: result.rooms?.[0]?.id || "",
        }));
      }
    } catch (error) {
      console.error("LOAD_RATES_ERROR", error);
      alert("โหลดข้อมูลราคาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function saveRate() {
    if (!form.room_type_id && !form.id) {
      alert("กรุณาเลือกประเภทห้อง");
      return;
    }

    if (Number(form.price_per_person) < 0) {
      alert("กรุณากรอกราคาให้ถูกต้อง");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/rates", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        alert(result.message || result.error || "บันทึกราคาไม่สำเร็จ");
        return;
      }

      alert(form.id ? "อัปเดตราคาสำเร็จ" : "เพิ่มราคาสำเร็จ");

      setForm({
        ...emptyForm,
        room_type_id: rooms[0]?.id || "",
      });

      await loadData();
    } catch (error) {
      console.error("SAVE_RATE_ERROR", error);
      alert("บันทึกราคาไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function editRate(rate: Rate) {
    setForm({
      id: rate.id,
      room_type_id: rate.room_type_id,
      day_type: rate.day_type,
      price_per_person: Number(rate.price_per_person || 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      room_type_id: rooms[0]?.id || "",
    });
  }

  const filteredRates = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    if (!key) return rates;

    return rates.filter((rate) => {
      return [
        rate.room_type?.name,
        rate.day_type,
        rate.price_per_person,
        rate.room_type?.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(key);
    });
  }, [keyword, rates]);

  const weekdayRates = rates.filter((rate) => rate.day_type === "WEEKDAY");
  const weekendRates = rates.filter((rate) => rate.day_type === "WEEKEND");

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
              <WalletCards size={16} />
              Price Management
            </div>

            <h1 className="mt-5 text-4xl font-black md:text-5xl">
              จัดการเรทราคา
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              ราคาเป็นแบบต่อคน / ต่อคืน แยกวันธรรมดา และศุกร์-อาทิตย์
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="ทั้งหมด" value={rates.length} />
            <HeroStat label="วันธรรมดา" value={weekdayRates.length} />
            <HeroStat label="ศุกร์-อาทิตย์" value={weekendRates.length} />
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
                  {form.id ? "Edit Price" : "Create Price"}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {form.id ? "แก้ไขราคา" : "เพิ่มราคาใหม่"}
                </h2>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            <label>
              <p className="mb-2 text-sm font-black">ประเภทห้อง</p>
              <select
                value={form.room_type_id}
                disabled={Boolean(form.id)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    room_type_id: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none disabled:bg-slate-100"
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
              <p className="mb-2 text-sm font-black">ช่วงวัน</p>
              <select
                value={form.day_type}
                disabled={Boolean(form.id)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    day_type: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none disabled:bg-slate-100"
                style={{ borderColor: UI.line }}
              >
                <option value="WEEKDAY">จันทร์ - พฤหัส</option>
                <option value="WEEKEND">ศุกร์ - อาทิตย์</option>
              </select>
            </label>

            <label>
              <p className="mb-2 text-sm font-black">ราคา / คน / คืน</p>
              <input
                type="number"
                value={form.price_per_person}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    price_per_person: Number(event.target.value),
                  }))
                }
                className="h-12 w-full rounded-2xl border px-4 text-sm font-bold outline-none"
                style={{ borderColor: UI.line }}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={saveRate}
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
                {form.id ? "บันทึก" : "เพิ่มราคา"}
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
                  Price List
                </p>
                <h2 className="mt-2 text-3xl font-black">รายการราคา</h2>
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
                    placeholder="ค้นหาห้อง / ช่วงวัน"
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
                <p className="mt-4 text-2xl font-black">กำลังโหลดข้อมูลราคา</p>
              </div>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center p-6 text-center">
              <div>
                <WalletCards className="mx-auto" size={56} color={UI.orange} />
                <h3 className="mt-5 text-3xl font-black">ยังไม่มีข้อมูลราคา</h3>
                <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
                  เพิ่มราคาใหม่จากฟอร์มด้านซ้าย
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-5">
              {filteredRates.map((rate) => (
                <RateCard key={rate.id} rate={rate} onEdit={() => editRate(rate)} />
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

function RateCard({ rate, onEdit }: { rate: Rate; onEdit: () => void }) {
  return (
    <article
      className="rounded-[30px] border p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: UI.paper,
        borderColor: UI.line,
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_220px_180px] lg:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
              style={{
                background: UI.orangeSoft,
                color: UI.orange,
              }}
            >
              <CheckCircle2 size={14} />
              {rate.day_type === "WEEKEND" ? "ศุกร์ - อาทิตย์" : "จันทร์ - พฤหัส"}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black">
            {rate.room_type?.name || "ไม่พบประเภทห้อง"}
          </h3>

          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            รองรับ {rate.room_type?.capacity || "-"} คน /{" "}
            {rate.room_type?.unit_label || "ห้อง"}
          </p>
        </div>

        <div
          className="rounded-[26px] p-4"
          style={{
            background: UI.black,
            color: "#ffffff",
          }}
        >
          <p className="text-xs font-black text-white/50">ราคา / คน / คืน</p>
          <p className="mt-1 text-4xl font-black" style={{ color: UI.orange }}>
            ฿{Number(rate.price_per_person || 0).toLocaleString()}
          </p>
        </div>

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