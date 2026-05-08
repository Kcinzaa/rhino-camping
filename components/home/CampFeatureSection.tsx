import {
  Bath,
  Flame,
  Mountain,
  ShieldCheck,
  Sparkles,
  TentTree,
  Wifi,
  Wind,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const features = [
  {
    title: "ที่พักฟีลแคมป์",
    description: "เต็นท์และโดมส่วนตัว ให้บรรยากาศใกล้ชิดธรรมชาติ",
    icon: TentTree,
  },
  {
    title: "หมูกระทะ / ปิ้งย่าง",
    description: "เพิ่มบริการเสริมในขั้นตอนการจองได้ง่าย",
    icon: Flame,
  },
  {
    title: "วิวธรรมชาติ",
    description: "เหมาะกับการพักผ่อน ถ่ายรูป และเดินเล่นยามเย็น",
    icon: Mountain,
  },
  {
    title: "ห้องน้ำสะอาด",
    description: "มีสิ่งอำนวยความสะดวกครบสำหรับการพักผ่อน",
    icon: Bath,
  },
  {
    title: "Wi-Fi",
    description: "รองรับการใช้งานพื้นฐานสำหรับลูกค้าที่ต้องการออนไลน์",
    icon: Wifi,
  },
  {
    title: "อากาศดี",
    description: "พื้นที่เปิดโล่ง ลมผ่าน เหมาะกับการนั่งชิล",
    icon: Wind,
  },
  {
    title: "ปลอดภัย",
    description: "มีระบบจัดการการจองและตรวจสอบสถานะชัดเจน",
    icon: ShieldCheck,
  },
  {
    title: "จองง่าย",
    description: "เลือกวัน เลือกที่พัก ชำระเงิน และรอยืนยันได้ทันที",
    icon: Sparkles,
  },
];

export default function CampFeatureSection() {
  return (
    <section className="bg-[#f7f1e7] py-20">
      <div className="camp-container">
        <SectionHeader
          eyebrow="Camp Experience"
          title="ครบทุกอย่างสำหรับทริปพักผ่อน"
          description="ออกแบบให้เหมาะกับเว็บจองที่พักจริง ใช้ง่ายบนมือถือ และต่อยอดระบบหลังบ้านได้"
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-[32px] border border-white/80 bg-white/70 p-6 shadow-sm transition hover:-translate-y-2 hover:bg-white hover:shadow-2xl hover:shadow-green-950/10"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#1f3d2b] text-white shadow-lg shadow-green-950/16 transition group-hover:scale-110 group-hover:bg-[#e97732]">
                  <Icon size={25} />
                </div>

                <p className="mt-6 text-sm font-black text-[#e97732]">
                  0{index + 1}
                </p>

                <h3 className="mt-2 text-xl font-black text-[#1f3d2b]">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}