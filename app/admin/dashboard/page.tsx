"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Home,
  Loader2,
  ReceiptText,
  TentTree,
  WalletCards,
} from "lucide-react";

type Stats = {
  totalBookings: number;
  waitingPayment: number;
  waitingVerify: number;
  confirmed: number;
  cancelled: number;
  revenue: number;
  totalRoomTypes: number;
  activeRoomTypes: number;
};

const UI = {
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  line: "#e8ddd0",
  muted: "#64748b",
  green: "#16a34a",
  red: "#dc2626",
  cream: "#fff7ed",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    waitingPayment: 0,
    waitingVerify: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0,
    totalRoomTypes: 0,
    activeRoomTypes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  function getToken() {
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadStats() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error(result);
        setLoading(false);
        return;
      }

      setStats(result.stats);
    } catch (error) {
      console.error("LOAD_ADMIN_STATS_ERROR", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section
        className="rounded-[34px] border p-10 text-center"
        style={{ background: UI.paper, borderColor: UI.line }}
      >
        <Loader2 className="mx-auto animate-spin" size={48} color={UI.orange} />
        <p className="mt-4 text-2xl font-black">กำลังโหลดหน้าหลักแอดมิน</p>
      </section>
    );
  }

  return (
    <div className="grid gap-7">
      <section
        className="relative overflow-hidden rounded-[42px] border p-7 md:p-10"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #171717 54%, #301606 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: UI.orange }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                background: "rgba(249,115,22,0.12)",
                color: UI.orange,
                border: "1px solid rgba(249,115,22,0.35)",
              }}
            >
              <TentTree size={16} />
              Rhino Camping Admin
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              หน้าหลักสำหรับจัดการระบบจอง
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/55 md:text-base">
              ตรวจรายการจอง รอสลิป ยืนยันห้องพัก จัดการห้อง ราคา และปฏิทินห้องว่าง
              จากหลังบ้านหน้าเดียว
            </p>
          </div>

          <div className="rounded-[34px] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black text-white/55">รายได้ที่ยืนยันแล้ว</p>
            <p className="mt-2 text-5xl font-black" style={{ color: UI.orange }}>
              ฿{Number(stats.revenue || 0).toLocaleString()}
            </p>

            <Link
              href="/admin/bookings"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white"
              style={{ background: UI.orange }}
            >
              ไปจัดการรายการจอง
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="รายการจองทั้งหมด"
          value={stats.totalBookings}
          icon={<ReceiptText size={24} />}
        />

        <StatCard
          title="รอชำระเงิน"
          value={stats.waitingPayment}
          icon={<WalletCards size={24} />}
          orange
        />

        <StatCard
          title="รอตรวจสลิป"
          value={stats.waitingVerify}
          icon={<AlertTriangle size={24} />}
          orange
        />

        <StatCard
          title="ยืนยันแล้ว"
          value={stats.confirmed}
          icon={<CheckCircle2 size={24} />}
          green
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="รายการยกเลิก"
          value={stats.cancelled}
          icon={<AlertTriangle size={24} />}
          red
        />

        <StatCard
          title="ประเภทห้องทั้งหมด"
          value={stats.totalRoomTypes}
          icon={<TentTree size={24} />}
        />

        <StatCard
          title="ประเภทห้องที่เปิดขาย"
          value={stats.activeRoomTypes}
          icon={<Home size={24} />}
          green
        />
      </section>

      <section
        className="rounded-[38px] border p-6"
        style={{
          background: UI.paper,
          borderColor: UI.line,
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: UI.orange }}
            >
              Quick Actions
            </p>
            <h2 className="mt-2 text-3xl font-black">เมนูจัดการหลัก</h2>
            <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
              เลือกส่วนที่ต้องการจัดการ
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ActionCard
            href="/admin/bookings"
            title="ตรวจรายการจอง"
            description="ดูรายการจองทั้งหมด ตรวจสลิป ยืนยันหรือยกเลิก"
            icon={<ReceiptText size={28} />}
          />

          <ActionCard
            href="/admin/bookings?status=WAITING_VERIFY"
            title="รอตรวจสลิป"
            description="รายการที่ลูกค้าอัปโหลดสลิปแล้ว รอแอดมินยืนยัน"
            icon={<WalletCards size={28} />}
            orange
          />

          <ActionCard
            href="/admin/rooms"
            title="จัดการห้องพัก"
            description="แก้ชื่อห้อง รายละเอียด รูปภาพ และสถานะเปิดขาย"
            icon={<TentTree size={28} />}
          />

          <ActionCard
            href="/admin/room-units"
            title="ยูนิตห้อง"
            description="เพิ่มจำนวนห้องจริง เช่น กระโจม 14 หลัง รีสอร์ท 20 ห้อง"
            icon={<Home size={28} />}
          />

          <ActionCard
            href="/admin/prices"
            title="จัดการราคา"
            description="แก้ราคาวันธรรมดาและศุกร์-อาทิตย์"
            icon={<WalletCards size={28} />}
          />

          <ActionCard
            href="/admin/calendar"
            title="ปฏิทินห้องว่าง"
            description="ดูภาพรวมจำนวนห้องว่างจากรายการจอง"
            icon={<CalendarDays size={28} />}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  orange,
  green,
  red,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  orange?: boolean;
  green?: boolean;
  red?: boolean;
}) {
  const color = green ? UI.green : red ? UI.red : orange ? UI.orange : UI.black;

  return (
    <article
      className="rounded-[32px] border p-5 shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
        style={{ background: color }}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm font-black" style={{ color: UI.muted }}>
        {title}
      </p>

      <p className="mt-2 text-4xl font-black" style={{ color }}>
        {value}
      </p>
    </article>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon,
  orange,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  orange?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[32px] border p-5 transition hover:-translate-y-1 hover:shadow-xl"
      style={{
        background: orange ? UI.cream : "#ffffff",
        borderColor: orange ? "#fed7aa" : UI.line,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
        style={{ background: orange ? UI.orange : UI.black }}
      >
        {icon}
      </div>

      <h3 className="mt-5 text-2xl font-black">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-7" style={{ color: UI.muted }}>
        {description}
      </p>

      <div
        className="mt-5 inline-flex items-center gap-2 text-sm font-black"
        style={{ color: UI.orange }}
      >
        เข้าใช้งาน
        <ArrowRight
          size={18}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}