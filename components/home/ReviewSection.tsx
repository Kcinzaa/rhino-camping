import { Quote, Star } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const reviews = [
  {
    name: "คุณแพรว",
    text: "บรรยากาศดีมาก จองง่าย หน้าเว็บใช้งานสะดวก เหมาะกับมาพักผ่อนสุด ๆ",
    rating: 5,
  },
  {
    name: "คุณนนท์",
    text: "ชอบระบบตรวจสอบห้องว่าง เลือกวันแล้วเห็นที่พักทันที ไม่ต้องทักแชทถามนาน",
    rating: 5,
  },
  {
    name: "คุณเมย์",
    text: "โดมส่วนตัวสวยมาก มีพื้นที่ถ่ายรูปเยอะ เหมาะกับทริปสั้น ๆ วันหยุด",
    rating: 5,
  },
];

export default function ReviewSection() {
  return (
    <section className="camp-gradient py-20">
      <div className="camp-container">
        <SectionHeader
          eyebrow="Guest Reviews"
          title="เสียงจากผู้เข้าพัก"
          description="รีวิวช่วยสร้างความน่าเชื่อถือ และทำให้ลูกค้าตัดสินใจจองง่ายขึ้น"
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="rounded-[32px] border border-white/80 bg-white/80 p-7 shadow-xl shadow-green-950/8 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 text-[#e97732]">
                  {Array.from({ length: review.rating }).map((_, index) => (
                    <Star key={index} size={17} fill="currentColor" />
                  ))}
                </div>

                <Quote size={34} className="text-[#1f3d2b]/20" />
              </div>

              <p className="mt-6 text-base font-semibold leading-8 text-slate-600">
                “{review.text}”
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1f3d2b] text-lg font-black text-white">
                  {review.name.slice(3, 4)}
                </div>

                <div>
                  <p className="font-black text-[#1f3d2b]">{review.name}</p>
                  <p className="text-sm font-semibold text-slate-400">
                    Verified Guest
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}