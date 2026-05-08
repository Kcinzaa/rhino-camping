import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Star,
  TentTree,
} from "lucide-react";
import FloatingDecoration from "@/components/ui/FloatingDecoration";

const stats = [
  { label: "ที่พักพร้อมจอง", value: "18+" },
  { label: "วิวธรรมชาติ", value: "360°" },
  { label: "รีวิวเฉลี่ย", value: "4.9" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/camp-hero.jpg"
          alt="Camp hero"
          fill
          priority
          className="object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <FloatingDecoration />

      <div className="camp-container relative z-10">
        <div className="grid min-h-[calc(100vh-80px)] items-center gap-12 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-black text-white shadow-lg backdrop-blur-xl">
              <Sparkles size={16} className="text-[#ffb36a]" />
              Modern Glamping Booking
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl">
              พักผ่อนกลางธรรมชาติ
              <span className="block text-[#ffb36a]">จองง่ายในไม่กี่คลิก</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/78 md:text-xl">
              เลือกเต็นท์ บ้านพัก หรือโดมส่วนตัว ตรวจสอบห้องว่างแบบเรียลไทม์
              พร้อมระบบจองและอัปโหลดสลิปในเว็บเดียว
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#e97732] px-7 py-4 text-base font-black text-white shadow-2xl shadow-orange-950/30 transition hover:-translate-y-1 hover:bg-[#ff8b3d]"
              >
                จองที่พักเลย
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/booking"
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/22 bg-white/12 px-7 py-4 text-base font-black text-white backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/20"
              >
                ดูที่พักทั้งหมด
                <TentTree size={20} />
              </Link>
            </div>

            <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/16 bg-white/12 p-4 backdrop-blur-xl"
                >
                  <p className="text-2xl font-black text-white md:text-3xl">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-bold text-white/58 md:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="glass-card float-camp relative overflow-hidden rounded-[36px] p-4">
              <div className="relative h-[520px] overflow-hidden rounded-[30px]">
                <Image
                  src="/images/dome-1.jpg"
                  alt="Dome glamping"
                  fill
                  className="object-cover"
                />

                <div className="absolute inset-x-4 bottom-4 rounded-[28px] bg-white/90 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-1 text-[#e97732]">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} size={15} fill="currentColor" />
                        ))}
                      </div>

                      <h3 className="text-xl font-black text-[#1f3d2b]">
                        Private Dome View
                      </h3>

                      <p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-500">
                        <MapPin size={15} />
                        ริมเขา วิวธรรมชาติ
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#1f3d2b] px-4 py-3 text-right text-white">
                      <p className="text-xs font-bold text-white/60">เริ่มต้น</p>
                      <p className="text-lg font-black">฿1,590</p>
                    </div>
                  </div>

                  <Link
                    href="/booking"
                    className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#e97732] px-4 py-3 text-sm font-black text-white"
                  >
                    ตรวจสอบวันว่าง
                    <CalendarDays size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden">
          <div className="glass-card rounded-[32px] p-4 md:p-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e97732]">
                  Location
                </p>
                <p className="mt-2 text-lg font-black text-[#1f3d2b]">
                  Hat Yai, Songkhla
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e97732]">
                  Check-in
                </p>
                <p className="mt-2 text-lg font-black text-[#1f3d2b]">
                  หลัง 14:00 น.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e97732]">
                  Payment
                </p>
                <p className="mt-2 text-lg font-black text-[#1f3d2b]">
                  โอนเงิน / PromptPay
                </p>
              </div>

              <Link
                href="/booking"
                className="flex items-center justify-center gap-2 rounded-3xl bg-[#1f3d2b] p-5 text-lg font-black text-white transition hover:bg-[#2e5a3f]"
              >
                ปฏิทินห้องว่าง
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
