"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";

const LOGO_SRC = "/images/logo/rhinologo.jpg";

const navLinks = [
  { label: "จองที่พัก", href: "/booking", icon: CalendarDays },
  { label: "จัดการการจอง", href: "/manage", icon: ClipboardList },
];

const RHINO_POLICY = `ระเบียบการเข้าพัก Rhino Camp

1) ห้องพัก 1 ห้องพักได้ 2 ท่าน (หากท่านประสงค์จะพักเกิน 2 ท่าน กรุณาแจ้งพนักงาน)

2) ห้ามสูบบุหรี่ในที่พัก หากฝ่าฝืนปรับ 2,000 บาท

3) กรุณาสวมใส่ริสแบนด์ตลอดการเข้าพักใน Camp (หากไม่สวมใส่ริสแบนด์จะไม่สามารถเข้าร่วมรับประทานบุฟเฟ่ต์กับทาง Camp ได้)

4) ห้ามนำอาหารบุฟเฟ่ต์ออกนอกลานทานอาหาร

5) อาหารมีเติมตลอด กรุณาตักแต่พอทาน

* หากทานไม่หมด ทาง Rhino Camp จะมีค่าปรับตามเงื่อนไขของทาง Camp กำหนด

เวลาบุฟเฟต์
(เย็น) 18:00-21:00 น.
(เช้า) 7:00-10:00 น.

6) กรุณาลดใช้เสียงดังหลัง 23:00 น. (เพื่อไม่ให้เป็นการรบกวนผู้เข้าพักท่านอื่น)

7) กรณีมีของชำรุด เสียหาย หรือสูญหาย ทาง Rhino Camp จะมีค่าปรับตามเงื่อนไขของทาง Camp กำหนด

8) เช็คเอาท์ก่อนเวลา 12:00 น. พร้อมนำกระติก (แก้วน้ำและที่คีบน้ำแข็ง) มาคืนที่จุดบริการด้วยนะคะ

*** ขอบพระคุณลูกค้าที่ให้ความร่วมมือกับทาง Rhino Camp ค่ะ ***`;

export default function Footer() {
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <footer className="relative mt-10 overflow-hidden bg-[#101c15] text-white md:mt-12">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#f97316]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-8 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="camp-container relative py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <div>
            <Link href="/booking" className="group flex w-fit items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-orange-950/25 transition group-hover:scale-105">
                <Image
                  src={LOGO_SRC}
                  alt="Rhino Camp logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-black">Rhino Camp</h2>
                <p className="text-xs font-semibold text-white/55">
                  Booking & Guest Management
                </p>
              </div>
            </Link>

            <p className="mt-4 max-w-md text-sm font-semibold leading-7 text-white/62">
              ระบบจองที่พักสำหรับ Rhino Camp ตรวจห้องว่าง เลือกวันเข้าพัก
              จัดการรายการจอง อัปโหลดสลิป และติดตามสถานะได้ในที่เดียว
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <ContactPill icon={<MessageCircle size={17} />} label="LINE" />
              <ContactPill icon={<Phone size={17} />} label="โทรสอบถาม" />
              <ContactPill icon={<Mail size={17} />} label="อีเมล" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#fb923c]">
              เมนูหลัก
            </h3>
            <div className="mt-4 grid gap-3">
              {navLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex w-fit items-center gap-3 text-sm font-bold text-white/62 transition hover:text-white"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[#fb923c] transition group-hover:bg-[#f97316] group-hover:text-white">
                      <Icon size={17} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="group flex w-fit items-center gap-3 text-left text-sm font-bold text-white/62 transition hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-[#fb923c] transition group-hover:bg-[#f97316] group-hover:text-white">
                  <ShieldCheck size={17} />
                </span>
                นโยบายที่พัก
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#fb923c]">
              ติดต่อ Rhino Camp
            </h3>
            <div className="mt-4 grid gap-3 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
              <InfoLine icon={<MapPin size={18} />} text="Rhino Camp, Thailand" />
              <InfoLine icon={<Phone size={18} />} text="ติดต่อผ่าน LINE / โทรศัพท์" />
              <InfoLine icon={<Mail size={18} />} text="รับอีเมลยืนยันหลังจองสำเร็จ" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-5 text-xs font-semibold text-white/38 md:flex-row">
          <p>© 2026 Rhino Camp. All rights reserved.</p>
          <p>Modern booking system for Rhino Camp guests.</p>
        </div>
      </div>

      {policyOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-md md:px-4 md:py-6"
          onMouseDown={() => setPolicyOpen(false)}
        >
          <div
            className="mobile-slide-panel max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-hidden rounded-[28px] bg-[#fff8ec] text-[#101010] shadow-2xl md:max-h-[calc(100vh-48px)] md:rounded-[32px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#e8ddd0] p-4 md:gap-4 md:p-5">
              <div className="flex gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f97316] text-white">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f97316]">
                    Rhino Camp
                  </p>
                  <h2 className="text-xl font-black md:text-2xl">นโยบายที่พัก</h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPolicyOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#101010] text-white"
                aria-label="ปิดนโยบาย"
              >
                <X size={22} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-4 md:p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm font-semibold leading-8 text-slate-700">
                {RHINO_POLICY}
              </pre>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

function ContactPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white/75">
      <span className="text-[#fb923c]">{icon}</span>
      {label}
    </span>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-bold text-white/68">
      <span className="text-[#fb923c]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
