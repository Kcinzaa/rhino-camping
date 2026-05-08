import {
  Bath,
  BedDouble,
  Coffee,
  Flame,
  Mountain,
  Snowflake,
  TentTree,
  UsersRound,
  Wifi,
} from "lucide-react";

export type RoomDeal = {
  id: string;
  title: string;
  badge?: string;
  description: string;
  price: number;
  originalPrice?: number;
  policies: string[];
  includes: string[];
};

export type RoomType = {
  id: string;
  name: string;
  shortName: string;
  available: number;
  capacityLabel: string;
  bedLabel: string;
  priceStart: number;
  coverImage: string;
  gallery: string[];
  description: string;
  highlights: string[];
  amenities: {
    label: string;
    iconName:
      | "wifi"
      | "bath"
      | "fire"
      | "mountain"
      | "coffee"
      | "snow"
      | "bed"
      | "tent";
  }[];
  deals: RoomDeal[];
};

export const categoryTabs = [
  {
    id: "tent-2",
    label: "เต็นท์สำหรับ 2 ท่าน",
    available: 10,
  },
  {
    id: "tent-4",
    label: "เต็นท์สำหรับ 4 ท่าน",
    available: 4,
  },
  {
    id: "cabin-4",
    label: "บ้านสำหรับ 4 ท่าน",
    available: 2,
  },
  {
    id: "private-2",
    label: "เต็นท์ Private 2 ท่าน",
    available: 2,
  },
  {
    id: "dome-vip",
    label: "โดม VIP สำหรับ 2 ท่าน",
    available: 0,
  },
];

export const rooms: RoomType[] = [
  {
    id: "tent-2",
    name: "เต็นท์ Glamping สำหรับ 2 ท่าน",
    shortName: "เต็นท์ 2 ท่าน",
    available: 10,
    capacityLabel: "1-3 ท่าน",
    bedLabel: "Mattress King Size",
    priceStart: 2400,
    coverImage: "/images/tent-1.jpg",
    gallery: ["/images/tent-1.jpg", "/images/tent-2.jpg", "/images/camp-gallery-1.jpg"],
    description:
      "เต็นท์สไตล์ Glamping สำหรับคู่รักหรือเพื่อน 2 คน บรรยากาศใกล้ชิดธรรมชาติ พร้อมพื้นที่นั่งเล่นด้านหน้า",
    highlights: [
      "รวมอาหารเช้าและเซ็ตเครื่องดื่มต้อนรับ",
      "มีพื้นที่นั่งเล่นส่วนตัวหน้าเต็นท์",
      "เหมาะสำหรับคู่รัก เพื่อน หรือครอบครัวเล็ก",
      "สามารถเพิ่มบริการหมูกระทะหรือเตาปิ้งย่างได้",
    ],
    amenities: [
      { label: "Wi-Fi", iconName: "wifi" },
      { label: "ห้องน้ำสะอาด", iconName: "bath" },
      { label: "โซนปิ้งย่าง", iconName: "fire" },
      { label: "วิวธรรมชาติ", iconName: "mountain" },
      { label: "อาหารเช้า", iconName: "coffee" },
      { label: "ที่นอนใหญ่", iconName: "bed" },
    ],
    deals: [
      {
        id: "normal",
        title: "แพ็กเกจปกติ",
        description: "จองได้ทุกวัน เหมาะสำหรับเข้าพักทั่วไป",
        price: 2600,
        originalPrice: 2800,
        policies: [
          "เช็คอิน 14:00 น. / เช็คเอาท์ 11:00 น.",
          "รวมอาหารเช้า 2 ท่าน",
          "ไม่สามารถคืนเงินได้ การเปลี่ยนวันขึ้นอยู่กับนโยบายที่พัก",
          "เด็กอายุต่ำกว่า 7 ปี พักฟรีเมื่อใช้เตียงร่วมกับผู้ปกครอง",
        ],
        includes: ["อาหารเช้า", "น้ำดื่ม", "Wi-Fi", "ชุดเครื่องนอน"],
      },
      {
        id: "summer-sale",
        title: "โปรพิเศษ Summer Sale",
        badge: "SALE",
        description: "ราคาพิเศษจำนวนจำกัด สำหรับช่วงโปรโมชัน",
        price: 2400,
        originalPrice: 2600,
        policies: [
          "รวมอาหารเช้าและเครื่องดื่มต้อนรับ",
          "ไม่สามารถคืนเงินได้",
          "เปลี่ยนวันได้ 1 ครั้ง ก่อนวันเข้าพักอย่างน้อย 7 วัน",
        ],
        includes: ["อาหารเช้า", "เครื่องดื่ม", "Wi-Fi"],
      },
    ],
  },
  {
    id: "tent-4",
    name: "เต็นท์ Family สำหรับ 4 ท่าน",
    shortName: "เต็นท์ 4 ท่าน",
    available: 4,
    capacityLabel: "2-5 ท่าน",
    bedLabel: "Family Mattress",
    priceStart: 3200,
    coverImage: "/images/tent-2.jpg",
    gallery: ["/images/tent-2.jpg", "/images/camp-gallery-2.jpg", "/images/camp-gallery-3.jpg"],
    description:
      "เต็นท์ขนาดใหญ่สำหรับครอบครัวหรือกลุ่มเพื่อน มีพื้นที่กว้าง นั่งเล่นสะดวก และใกล้โซนกิจกรรม",
    highlights: [
      "เหมาะกับกลุ่มเพื่อนและครอบครัว",
      "มีพื้นที่วางของและนั่งเล่นมากขึ้น",
      "ใกล้โซนกิจกรรมและคาเฟ่",
      "รองรับบริการเสริม BBQ",
    ],
    amenities: [
      { label: "Wi-Fi", iconName: "wifi" },
      { label: "ห้องน้ำสะอาด", iconName: "bath" },
      { label: "BBQ", iconName: "fire" },
      { label: "อาหารเช้า", iconName: "coffee" },
      { label: "ที่นอนครอบครัว", iconName: "bed" },
      { label: "เต็นท์ใหญ่", iconName: "tent" },
    ],
    deals: [
      {
        id: "normal",
        title: "แพ็กเกจครอบครัว",
        description: "สำหรับ 4 ท่าน รวมอาหารเช้าและชุดเครื่องนอน",
        price: 3400,
        originalPrice: 3700,
        policies: [
          "เช็คอิน 14:00 น. / เช็คเอาท์ 11:00 น.",
          "รวมอาหารเช้า 4 ท่าน",
          "เพิ่มผู้เข้าพักได้ มีค่าใช้จ่ายเพิ่มเติม",
          "ไม่สามารถคืนเงินได้",
        ],
        includes: ["อาหารเช้า", "Wi-Fi", "น้ำดื่ม", "ชุดเครื่องนอน"],
      },
      {
        id: "bbq",
        title: "แพ็กเกจ Family BBQ",
        badge: "HOT",
        description: "รวมชุด BBQ สำหรับครอบครัว",
        price: 3900,
        originalPrice: 4300,
        policies: [
          "รวมอาหารเช้า 4 ท่าน",
          "รวมชุด BBQ 1 ชุด",
          "ไม่สามารถคืนเงินได้",
        ],
        includes: ["อาหารเช้า", "ชุด BBQ", "Wi-Fi", "น้ำดื่ม"],
      },
    ],
  },
  {
    id: "cabin-4",
    name: "บ้านพักแคมป์สำหรับ 4 ท่าน",
    shortName: "บ้านพัก 4 ท่าน",
    available: 2,
    capacityLabel: "2-4 ท่าน",
    bedLabel: "Queen Bed x 2",
    priceStart: 4200,
    coverImage: "/images/camp-gallery-1.jpg",
    gallery: ["/images/camp-gallery-1.jpg", "/images/camp-gallery-2.jpg", "/images/tent-1.jpg"],
    description:
      "บ้านพักสไตล์แคมป์ สำหรับคนที่อยากได้ความสะดวกสบายมากขึ้น พร้อมห้องน้ำในตัวและพื้นที่ส่วนตัว",
    highlights: [
      "มีห้องน้ำในตัว",
      "เหมาะกับครอบครัว",
      "พื้นที่กว้างและเป็นส่วนตัว",
      "ใกล้จุดชมวิว",
    ],
    amenities: [
      { label: "แอร์", iconName: "snow" },
      { label: "ห้องน้ำในตัว", iconName: "bath" },
      { label: "Wi-Fi", iconName: "wifi" },
      { label: "อาหารเช้า", iconName: "coffee" },
      { label: "วิวภูเขา", iconName: "mountain" },
      { label: "เตียงใหญ่", iconName: "bed" },
    ],
    deals: [
      {
        id: "normal",
        title: "แพ็กเกจบ้านพัก",
        description: "บ้านพักส่วนตัวพร้อมสิ่งอำนวยความสะดวกครบ",
        price: 4500,
        originalPrice: 4900,
        policies: [
          "รวมอาหารเช้า 4 ท่าน",
          "มีห้องน้ำในตัว",
          "ห้ามสูบบุหรี่ภายในห้องพัก",
          "ไม่สามารถคืนเงินได้",
        ],
        includes: ["อาหารเช้า", "Wi-Fi", "แอร์", "ห้องน้ำในตัว"],
      },
    ],
  },
  {
    id: "private-2",
    name: "เต็นท์ Private สำหรับ 2 ท่าน",
    shortName: "Private 2 ท่าน",
    available: 2,
    capacityLabel: "1-2 ท่าน",
    bedLabel: "Private King Bed",
    priceStart: 3600,
    coverImage: "/images/dome-1.jpg",
    gallery: ["/images/dome-1.jpg", "/images/camp-gallery-3.jpg", "/images/tent-2.jpg"],
    description:
      "เต็นท์ส่วนตัวตำแหน่งพิเศษ เหมาะกับคู่รัก มีมุมถ่ายรูปและพื้นที่ส่วนตัวมากกว่าเต็นท์ปกติ",
    highlights: [
      "ความเป็นส่วนตัวสูง",
      "เหมาะสำหรับคู่รัก",
      "มีมุมถ่ายรูปส่วนตัว",
      "บริการตกแต่งวันพิเศษเพิ่มเติมได้",
    ],
    amenities: [
      { label: "Wi-Fi", iconName: "wifi" },
      { label: "ห้องน้ำสะอาด", iconName: "bath" },
      { label: "อาหารเช้า", iconName: "coffee" },
      { label: "วิวส่วนตัว", iconName: "mountain" },
      { label: "ที่นอนใหญ่", iconName: "bed" },
      { label: "โซนแคมป์ไฟ", iconName: "fire" },
    ],
    deals: [
      {
        id: "couple",
        title: "แพ็กเกจ Couple Private",
        badge: "LOVE",
        description: "เหมาะสำหรับคู่รัก พร้อมมุมพักผ่อนส่วนตัว",
        price: 3800,
        originalPrice: 4200,
        policies: [
          "รวมอาหารเช้า 2 ท่าน",
          "มีพื้นที่ส่วนตัวหน้าเต็นท์",
          "เปลี่ยนวันได้ตามเงื่อนไขที่พัก",
        ],
        includes: ["อาหารเช้า", "เครื่องดื่ม", "Wi-Fi", "พื้นที่ส่วนตัว"],
      },
    ],
  },
  {
    id: "dome-vip",
    name: "โดม VIP สำหรับ 2 ท่าน",
    shortName: "Dome VIP",
    available: 0,
    capacityLabel: "1-2 ท่าน",
    bedLabel: "King Bed + Bathtub",
    priceStart: 5200,
    coverImage: "/images/dome-1.jpg",
    gallery: ["/images/dome-1.jpg", "/images/camp-gallery-1.jpg", "/images/camp-gallery-2.jpg"],
    description:
      "ห้องพักโดมพรีเมียม วิวธรรมชาติ เหมาะกับทริปพิเศษและลูกค้าที่ต้องการความสะดวกสบายสูง",
    highlights: [
      "ห้องพักพรีเมียม",
      "มีอ่างอาบน้ำ",
      "วิวดีที่สุดของรีสอร์ต",
      "เหมาะกับวันครบรอบหรือวันพิเศษ",
    ],
    amenities: [
      { label: "แอร์", iconName: "snow" },
      { label: "อ่างอาบน้ำ", iconName: "bath" },
      { label: "Wi-Fi", iconName: "wifi" },
      { label: "อาหารเช้า", iconName: "coffee" },
      { label: "วิวภูเขา", iconName: "mountain" },
      { label: "เตียง King", iconName: "bed" },
    ],
    deals: [
      {
        id: "vip",
        title: "แพ็กเกจ VIP",
        description: "โดม VIP พร้อมบริการพิเศษ",
        price: 5500,
        originalPrice: 5900,
        policies: [
          "รวมอาหารเช้า 2 ท่าน",
          "มีอ่างอาบน้ำ",
          "มี welcome drink",
          "ห้องเต็มในวันที่เลือก",
        ],
        includes: ["อาหารเช้า", "Welcome drink", "อ่างอาบน้ำ", "แอร์"],
      },
    ],
  },
];

export const amenityIcons = {
  wifi: Wifi,
  bath: Bath,
  fire: Flame,
  mountain: Mountain,
  coffee: Coffee,
  snow: Snowflake,
  bed: BedDouble,
  tent: TentTree,
};

export const calendarDays = [
  { day: 26, status: "disabled" },
  { day: 27, status: "disabled" },
  { day: 28, status: "disabled" },
  { day: 29, status: "disabled" },
  { day: 30, status: "disabled" },
  { day: 1, status: "disabled" },
  { day: 2, status: "disabled" },
  { day: 3, status: "disabled" },
  { day: 4, status: "disabled" },
  { day: 5, status: "available" },
  { day: 6, status: "available" },
  { day: 7, status: "available" },
  { day: 8, status: "available" },
  { day: 9, status: "busy" },
  { day: 10, status: "available", weekend: true },
  { day: 11, status: "available" },
  { day: 12, status: "available" },
  { day: 13, status: "available" },
  { day: 14, status: "available" },
  { day: 15, status: "available" },
  { day: 16, status: "almost" },
  { day: 17, status: "available", weekend: true },
  { day: 18, status: "available" },
  { day: 19, status: "available" },
  { day: 20, status: "available" },
  { day: 21, status: "available" },
  { day: 22, status: "available" },
  { day: 23, status: "busy" },
  { day: 24, status: "available", weekend: true },
  { day: 25, status: "available" },
  { day: 26, status: "available" },
  { day: 27, status: "available" },
  { day: 28, status: "available" },
  { day: 29, status: "available" },
  { day: 30, status: "full" },
  { day: 31, status: "available", weekend: true },
  { day: 1, status: "disabled" },
  { day: 2, status: "disabled" },
  { day: 3, status: "disabled" },
  { day: 4, status: "disabled" },
  { day: 5, status: "disabled" },
  { day: 6, status: "disabled" },
];

export const weekDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];