import Image from "next/image";
import SectionHeader from "@/components/ui/SectionHeader";

const gallery = [
  {
    src: "/images/camp-gallery-1.jpg",
    title: "ลานแคมป์",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/images/camp-gallery-2.jpg",
    title: "บรรยากาศกลางคืน",
    className: "",
  },
  {
    src: "/images/camp-gallery-3.jpg",
    title: "พื้นที่นั่งชิล",
    className: "",
  },
  {
    src: "/images/tent-1.jpg",
    title: "เต็นท์ส่วนตัว",
    className: "",
  },
  {
    src: "/images/dome-1.jpg",
    title: "โดม VIP",
    className: "",
  },
];

export default function GallerySection() {
  return (
    <section className="bg-[#f7f1e7] py-20">
      <div className="camp-container">
        <SectionHeader
          eyebrow="Gallery"
          title="บรรยากาศที่พัก"
          description="แกลเลอรีสำหรับโชว์รูปมุมต่าง ๆ ของที่พัก ช่วยให้ลูกค้าตัดสินใจจองง่ายขึ้น"
        />

        <div className="mt-12 grid auto-rows-[230px] gap-5 md:grid-cols-4">
          {gallery.map((item) => (
            <div
              key={item.src}
              className={`group relative overflow-hidden rounded-[32px] shadow-xl shadow-green-950/8 ${item.className}`}
            >
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="text-xl font-black text-white">{item.title}</p>
                <p className="mt-1 text-sm font-semibold text-white/70">
                  CampStay Experience
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}