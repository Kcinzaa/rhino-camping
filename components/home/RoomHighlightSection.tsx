import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Star,
  UsersRound,
  Wifi,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";

const rooms = [
  {
    id: "tent-2p",
    name: "เต็นท์ Private 2 ท่าน",
    image: "/images/tent-1.jpg",
    price: 990,
    capacity: 2,
    description: "เหมาะสำหรับคู่รักหรือเพื่อนที่ต้องการพักผ่อนแบบเรียบง่าย",
    amenities: ["Wi-Fi", "ที่นอน", "ห้องน้ำรวม"],
  },
  {
    id: "tent-4p",
    name: "เต็นท์ Family 4 ท่าน",
    image: "/images/tent-2.jpg",
    price: 1490,
    capacity: 4,
    description: "พื้นที่กว้างขึ้น เหมาะกับครอบครัวหรือกลุ่มเพื่อน",
    amenities: ["Wi-Fi", "ปิ้งย่าง", "วิวธรรมชาติ"],
  },
  {
    id: "dome-vip",
    name: "โดม VIP วิวธรรมชาติ",
    image: "/images/dome-1.jpg",
    price: 2190,
    capacity: 2,
    description: "ที่พักพรีเมียม มีความเป็นส่วนตัว เหมาะกับวันพิเศษ",
    amenities: ["แอร์", "ห้องน้ำในตัว", "อ่างอาบน้ำ"],
  },
];

export default function RoomHighlightSection() {
  return (
    <section className="camp-gradient py-20">
      <div className="camp-container">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            align="left"
            eyebrow="Popular Rooms"
            title="ที่พักแนะนำ"
            description="เลือกห้องหรือเต็นท์ที่เหมาะกับสไตล์การพักผ่อนของคุณ"
          />

          <Link
            href="/booking"
            className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[#1f3d2b] px-6 py-4 text-sm font-black text-white shadow-lg shadow-green-950/16 transition hover:-translate-y-1 hover:bg-[#2e5a3f]"
          >
            ดูทั้งหมด
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {rooms.map((room) => (
            <article
              key={room.id}
              className="group overflow-hidden rounded-[36px] border border-white/80 bg-white shadow-xl shadow-green-950/8 transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-950/14"
            >
              <div className="relative h-72 overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-110"
                />

                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-sm font-black text-[#1f3d2b] backdrop-blur-xl">
                  เริ่ม ฿{room.price.toLocaleString()} / คืน
                </div>

                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-[#1f3d2b]/90 px-3 py-2 text-sm font-black text-white backdrop-blur-xl">
                  <Star size={15} fill="currentColor" className="text-[#ffb36a]" />
                  4.9
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black text-[#1f3d2b]">
                      {room.name}
                    </h3>

                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                      {room.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-[#f7f1e7] p-3 text-center">
                    <UsersRound className="mx-auto text-[#e97732]" size={18} />
                    <p className="mt-1 text-xs font-black text-slate-600">
                      {room.capacity} ท่าน
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f7f1e7] p-3 text-center">
                    <Wifi className="mx-auto text-[#e97732]" size={18} />
                    <p className="mt-1 text-xs font-black text-slate-600">
                      Wi-Fi
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f7f1e7] p-3 text-center">
                    <Bath className="mx-auto text-[#e97732]" size={18} />
                    <p className="mt-1 text-xs font-black text-slate-600">
                      สะดวก
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {room.amenities.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#fff8ec] px-3 py-2 text-xs font-black text-[#8b5e34]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Link
                    href={`/booking?roomType=${room.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-[#f7f1e7] px-4 py-3 text-sm font-black text-[#1f3d2b] transition hover:bg-[#efe3cf]"
                  >
                    รายละเอียด
                  </Link>

                  <Link
                    href={`/booking?roomType=${room.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e97732] px-4 py-3 text-sm font-black text-white transition hover:bg-[#ff8b3d]"
                  >
                    จอง
                    <BedDouble size={17} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
