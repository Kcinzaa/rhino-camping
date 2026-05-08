"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  IdCard,
  LayoutDashboard,
  LogIn,
  Menu,
  ShieldCheck,
  Sparkles,
  TentTree,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { LineProfile } from "@/lib/line-profile";

const LOGO_SRC = "/images/logo/rhinologo.jpg";

const navItems = [
  { label: "จองที่พัก", href: "/booking", icon: CalendarDays },
  { label: "จัดการ", href: "/manage", icon: UserRound },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAdmin = profile?.role === "ADMIN";
  const visibleNavItems = isAdmin
    ? [
        ...navItems,
        { label: "Admin", href: "/admin/dashboard", icon: LayoutDashboard },
      ]
    : navItems;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { getLineProfile } = await import("@/lib/line-profile");
        const lineProfile = await getLineProfile();

        if (!active) return;
        setProfile(lineProfile);
      } catch (error) {
        console.error("LOAD_LINE_PROFILE_ERROR", error);

        if (!active) return;
        setProfile(null);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profilePopupOpen && !mobileOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfilePopupOpen(false);
        setMobileOpen(false);
      }
    }

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [profilePopupOpen, mobileOpen]);

  useEffect(() => {
    if (!isAdmin || typeof window === "undefined") return;

    const token =
      process.env.NEXT_PUBLIC_ADMIN_LOCAL_TOKEN || "admin-local-session";

    localStorage.setItem("adminToken", token);
    document.cookie = `adminToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }, [isAdmin]);

  return (
    <>
      <header className="sticky top-0 z-50 px-2 pb-2 pt-2 md:px-6 md:pb-3 md:pt-3">
        <div className="mx-auto w-full max-w-7xl rounded-[24px] border border-white/80 bg-[#fff8ec]/88 px-3 shadow-2xl shadow-green-950/10 backdrop-blur-2xl md:rounded-[28px] md:px-5">
          <div className="flex h-16 items-center justify-between gap-2 md:h-[72px] md:gap-4">
            <Link href="/booking" className="flex min-w-0 items-center gap-3">
              <LogoBox size="normal" />

              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-tight text-[#1f3d2b] sm:text-lg">
                  Rhino Camp
                </p>
                <p className="truncate text-[11px] font-semibold text-[#8b5e34] sm:text-xs">
                  Glamping & Nature Resort
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white hover:text-[#1f3d2b] hover:shadow-md active:scale-[0.98]"
                  >
                    <Icon
                      size={17}
                      className="text-[#8b5e34] transition group-hover:text-[#e97732]"
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={() => setProfilePopupOpen(true)}
                className="group inline-flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-3 py-2 shadow-md shadow-green-950/10 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-[0.98]"
              >
                <ProfileAvatar profile={profile} size="normal" />

                <div className="min-w-0 text-left">
                  <p className="max-w-[120px] truncate text-sm font-black text-[#1f3d2b]">
                    {profile?.displayName || "ผู้ใช้ LINE"}
                  </p>
                  <p className="text-[11px] font-bold text-slate-400">
                    {isAdmin ? "Admin LINE" : "LINE Profile"}
                  </p>
                </div>

                <ChevronDown size={16} className="text-[#e97732]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="tap-card inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f3d2b] shadow-md shadow-green-950/10 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/70 px-3 py-3 backdrop-blur-sm lg:hidden">
          <div className="mobile-safe-area mobile-slide-panel mx-auto max-h-[calc(100vh-24px)] w-full max-w-md overflow-y-auto rounded-[30px] bg-[#fff8ec] p-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/booking"
                onClick={() => setMobileOpen(false)}
                className="flex min-w-0 items-center gap-3"
              >
                <LogoBox size="normal" />

                <div className="min-w-0">
                  <p className="truncate text-xl font-black tracking-tight text-[#1f3d2b]">
                    Rhino Camping
                  </p>
                  <p className="truncate text-sm font-black text-[#8b5e34]">
                    Glamping & Nature Resort
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="tap-card flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#1f3d2b] shadow-md"
                aria-label="Close menu"
              >
                <X size={25} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setProfilePopupOpen(true);
              }}
                className="tap-card mt-5 flex w-full items-center justify-between rounded-[26px] border border-white bg-white p-4 text-left shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ProfileAvatar profile={profile} size="large" />

                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-[#1f3d2b]">
                    {profile?.displayName || "ผู้ใช้ LINE"}
                  </p>
                  <p className="truncate text-xs font-bold text-slate-400">
                    {isAdmin ? "Admin LINE" : "LINE Profile"}
                  </p>
                </div>
              </div>

              <ChevronDown size={20} className="text-[#e97732]" />
            </button>

            <nav className="mt-5 rounded-[26px] border border-white/70 bg-[#fff8ec] p-3 shadow-inner">
              <div className="grid gap-3">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="tap-card flex min-h-16 items-center gap-4 rounded-2xl bg-white/60 px-4 text-base font-black text-slate-700 shadow-sm transition active:scale-[0.98]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f7f1e7] text-[#1f3d2b]">
                        <Icon size={22} />
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {mounted &&
        profilePopupOpen &&
        createPortal(
          <ProfilePopup
            profile={profile}
            onClose={() => setProfilePopupOpen(false)}
          />,
          document.body
        )}
    </>
  );
}

function LogoBox({ size }: { size: "normal" | "large" }) {
  const [logoError, setLogoError] = useState(false);

  const boxSize = size === "large" ? "h-14 w-14" : "h-12 w-12";
  const iconSize = size === "large" ? 28 : 24;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#1f3d2b] shadow-lg shadow-green-950/20 ${boxSize}`}
    >
      {!logoError ? (
        <Image
          src={LOGO_SRC}
          alt="Rhino Camping Logo"
          fill
          sizes={size === "large" ? "56px" : "48px"}
          className="object-cover"
          priority
          onError={() => setLogoError(true)}
        />
      ) : (
        <TentTree size={iconSize} className="text-white" />
      )}
    </div>
  );
}

function ProfilePopup({
  profile,
  onClose,
}: {
  profile: LineProfile | null;
  onClose: () => void;
}) {
  const role = profile?.role || "USER";
  const isAdmin = role === "ADMIN";

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/65 px-3 py-4 backdrop-blur-md md:px-4 md:py-6"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[calc(100vh-32px)] w-full max-w-[450px] animate-[profilePopupIn_0.18s_ease-out] overflow-y-auto rounded-[28px] bg-white shadow-2xl shadow-black/35 md:max-h-[calc(100vh-48px)] md:rounded-[30px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="bg-[#05091a] px-6 pb-8 pt-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/80">
                LINE Profile
              </p>

              <h2 className="mt-2 text-3xl font-black leading-tight">
                ข้อมูลผู้ใช้
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="tap-card flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close profile popup"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="mobile-safe-area px-5 pb-6 pt-0 md:px-6 md:pb-7">
          <div className="-mt-10 flex flex-col items-center text-center">
            <div className="rounded-full bg-white p-1 shadow-xl">
              <ProfileAvatar profile={profile} size="popup" />
            </div>

            <p className="mt-5 max-w-full break-words text-2xl font-black text-[#05091a] md:text-3xl">
              {profile?.displayName || "ผู้ใช้ LINE"}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {isAdmin ? "Admin Mode" : "Customer Mode"}
            </p>
          </div>

          {isAdmin && (
            <Link
              href="/admin/dashboard"
              onClick={onClose}
              className="tap-card mt-6 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
            >
              <LayoutDashboard size={20} />
              ไปหน้า Admin Dashboard
            </Link>
          )}

          <div className="mt-6 grid gap-3">
            <ProfileInfoBox
              icon={<IdCard size={20} />}
              label="LINE USER ID"
              value={profile?.userId || "ยังไม่มีข้อมูล"}
            />

            <ProfileInfoBox
              icon={<BadgeCheck size={20} />}
              label="DISPLAY NAME"
              value={profile?.displayName || "ผู้ใช้ LINE"}
            />

            <ProfileInfoBox
              icon={<ShieldCheck size={20} />}
              label="ROLE"
              value={role}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 shrink-0 text-[#e97732]" size={19} />

              <p className="text-xs font-semibold leading-5 text-[#8b5e34]">
                ระบบใช้ LINE LIFF สำหรับยืนยันตัวตน ถ้า LINE User ID อยู่ในรายการแอดมิน ระบบจะแสดงทางเข้าแอดมินให้อัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tap-card mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#05091a] px-5 text-base font-black text-white transition hover:bg-[#11162c]"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileInfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-slate-400">{icon}</div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>

          <p className="mt-1 break-all text-sm font-black text-[#05091a]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileAvatar({
  profile,
  size,
}: {
  profile: LineProfile | null;
  size: "normal" | "large" | "popup";
}) {
  const [avatarError, setAvatarError] = useState(false);

  const avatarSize =
    size === "popup" ? "h-24 w-24" : size === "large" ? "h-14 w-14" : "h-10 w-10";

  const iconSize = size === "popup" ? 42 : size === "large" ? 26 : 20;
  const rounded = size === "popup" ? "rounded-full" : "rounded-2xl";

  if (profile?.pictureUrl && !avatarError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-[#1f3d2b] ${avatarSize} ${rounded}`}
      >
        <Image
          src={profile.pictureUrl}
          alt={profile.displayName || "LINE Profile"}
          fill
          sizes={size === "popup" ? "96px" : size === "large" ? "56px" : "40px"}
          className="object-cover"
          onError={() => setAvatarError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#1f3d2b] text-white ${avatarSize} ${rounded}`}
    >
      {profile ? <UserRound size={iconSize} /> : <LogIn size={iconSize} />}
    </div>
  );
}
