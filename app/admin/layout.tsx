"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  TentTree,
  WalletCards,
} from "lucide-react";

const LOGO_SRC = "/images/logo/rhinologo.jpg";

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  line: "#e8ddd0",
};

const navItems = [
  { label: "หน้าหลัก", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "รายการจอง", href: "/admin/bookings", icon: ReceiptText },
  { label: "จัดการห้อง", href: "/admin/rooms", icon: TentTree },
  { label: "ยูนิตห้อง", href: "/admin/room-units", icon: Home },
  { label: "ราคา", href: "/admin/prices", icon: WalletCards },
  { label: "ปฏิทิน", href: "/admin/calendar", icon: CalendarDays },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token && !isLoginPage) {
      router.replace("/admin/login");
      return;
    }

    if (token && isLoginPage) {
      router.replace("/admin/dashboard");
      return;
    }

    setChecking(false);
  }, [isLoginPage, router]);

  function logout() {
    localStorage.removeItem("adminToken");
    document.cookie =
      "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.replace("/admin/login");
  }

  if (checking && !isLoginPage) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ background: UI.page, color: UI.black }}
      >
        <div
          className="rounded-[34px] border p-8 text-center"
          style={{ background: UI.paper, borderColor: UI.line }}
        >
          <div
            className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: UI.orange, borderTopColor: "transparent" }}
          />
          <p className="mt-4 text-xl font-black">กำลังตรวจสอบสิทธิ์แอดมิน</p>
        </div>
      </main>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: UI.page,
        color: UI.black,
      }}
    >
      <aside
        className="fixed left-0 top-0 z-50 hidden h-screen w-[270px] border-r p-5 xl:block"
        style={{
          background: UI.black,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-3xl bg-white"
            style={{ boxShadow: "0 14px 34px rgba(249,115,22,0.18)" }}
          >
            <Image
              src={LOGO_SRC}
              alt="Rhino Camp logo"
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white">Rhino Admin</h1>
            <p className="text-xs font-bold text-white/45">
              Booking Management
            </p>
          </div>
        </Link>

        <nav className="mt-8 grid gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-black transition hover:bg-white/10"
                style={{
                  background: active ? UI.orange : "transparent",
                  color: active ? "#ffffff" : "rgba(255,255,255,0.62)",
                }}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="absolute bottom-5 left-5 right-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.10)" }}
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </aside>

      <div className="xl:ml-[270px]">
        <header
          className="sticky top-0 z-40 border-b"
          style={{
            background: "rgba(246,239,229,0.92)",
            borderColor: UI.line,
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-4 md:px-6">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: UI.orange }}
              >
                Admin Panel
              </p>

              <h2 className="text-xl font-black">จัดการระบบจองที่พัก</h2>
            </div>

            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black text-white xl:hidden"
              style={{ background: UI.black }}
            >
              <LogOut size={18} />
              ออก
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          {children}
        </div>
      </div>
    </main>
  );
}
