import {
  CalendarCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  TentTree,
} from "lucide-react";

export default function BookingHero() {
  return (
    <section className="relative overflow-hidden bg-[#122018] text-white">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-[-10%] top-[-20%] h-80 w-80 rounded-full bg-[#e97732] blur-[100px]" />
        <div className="absolute right-[-8%] bottom-[-20%] h-96 w-96 rounded-full bg-[#4ade80] blur-[120px]" />
      </div>

      <div className="camp-container relative z-10 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black backdrop-blur-xl">
              <Sparkles size={16} className="text-[#ffb36a]" />
              ระบบจองที่พักออนไลน์
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
              เลือกวัน เลือกเต็นท์
              <span className="block text-[#ffb36a]">แล้วจองได้ทันที</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/70 md:text-lg">
              หน้าจองที่ออกแบบใหม่ให้ทันสมัยกว่าเดิม เห็นจำนวนห้องว่างชัดเจน
              เลือกแพ็กเกจ ตรวจสอบปฏิทิน และเพิ่มลงรถเข็นได้ในหน้าเดียว
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <TentTree className="text-[#ffb36a]" size={26} />
              <p className="mt-4 text-2xl font-black">18+</p>
              <p className="mt-1 text-sm font-semibold text-white/60">
                ที่พักพร้อมจอง
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <CalendarCheck className="text-[#ffb36a]" size={26} />
              <p className="mt-4 text-2xl font-black">Real-time</p>
              <p className="mt-1 text-sm font-semibold text-white/60">
                ตรวจห้องว่าง
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <ShieldCheck className="text-[#ffb36a]" size={26} />
              <p className="mt-4 text-2xl font-black">Secure</p>
              <p className="mt-1 text-sm font-semibold text-white/60">
                จองปลอดภัย
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-bold text-white/64">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
            <MapPin size={16} />
            ฟีลแคมป์ ธรรมชาติ ส่วนตัว
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2">
            เช็คอิน 14:00 น.
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2">
            โอนเงิน / PromptPay / อัปโหลดสลิป
          </span>
        </div>
      </div>
    </section>
  );
}