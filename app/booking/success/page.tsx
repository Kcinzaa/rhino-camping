"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  CreditCard,
  Home,
  ReceiptText,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react";

type BookingGuest = {
  roomCartId: string;
  guestName: string;
  useBookerInfo: boolean;
  nationality: string;
  arrivalTime: string;
  note: string;
};

type BookingCartItem = {
  cartId: string;
  roomTypeId?: string;
  roomName: string;
  roomSlug?: string;
  quantity: number;
  adults: number;
  children: number;
  totalGuests: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  totalAmount?: number;
  coverImage?: string;

  // เผื่อข้อมูลเก่าที่ยังอยู่ใน localStorage
  dealTitle?: string;
  price?: number;
  image?: string;
  note?: string;
};

type LatestBooking = {
  bookingCode: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    contact: string;
  };
  guests?: BookingGuest[];
  payment: {
    method: string;
    reference: string;
    slipFileName: string;
    paymentReference?: string;
    pinCode?: string;
    expireAt?: string;
    status: string;
  };
  cart: {
    checkIn?: string;
    checkOut?: string;
    nights: number;
    items: BookingCartItem[];
    total: number;
    savedAt: string;
  };
  finalAmount: number;
  createdAt: string;
  status: string;
};

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  ink: "#111111",
  muted: "#64748b",
  black: "#101010",
  orange: "#f97316",
  cream: "#fff7ed",
  line: "#e8ddd0",
  green: "#16a34a",
  greenSoft: "#ecfdf5",
  red: "#dc2626",
};

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<BookingSuccessFallback />}>
      <BookingSuccessContent />
    </Suspense>
  );
}

function BookingSuccessFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: UI.page }}>
      <div className="text-center">
        <p className="text-xl font-black" style={{ color: UI.black }}>
          กำลังโหลดข้อมูลการจอง
        </p>
      </div>
    </div>
  );
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();

  const refFromUrl =
    searchParams.get("ref") || searchParams.get("code") || "TMP000000";

  const [booking, setBooking] = useState<LatestBooking | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("camp_latest_booking");

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LatestBooking;
      setBooking(parsed);
    } catch (error) {
      console.error("READ_LATEST_BOOKING_ERROR", error);
      setBooking(null);
    }
  }, []);

  const paymentReference =
    booking?.payment?.paymentReference || refFromUrl || "TMP000000";

  const pinCode = booking?.payment?.pinCode || "PIN000";

  const manageUrl = `/manage?ref=${encodeURIComponent(
    paymentReference
  )}&pin=${encodeURIComponent(pinCode)}`;

  const totalRooms = useMemo(() => {
    if (!booking) return 0;

    return booking.cart.items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);
  }, [booking]);

  const totalGuests = useMemo(() => {
    if (!booking) return 0;

    return booking.cart.items.reduce((sum, item) => {
      return sum + Number(item.totalGuests || 0);
    }, 0);
  }, [booking]);

  const totalAmount = booking?.finalAmount || booking?.cart.total || 0;
  const nights = booking?.cart.nights || 0;

  async function copyPaymentInfo() {
    try {
      await navigator.clipboard.writeText(
        `หมายเลขอ้างอิง: ${paymentReference}\nรหัส PIN: ${pinCode}`
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      alert("คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง");
    }
  }

  return (
    <main
      className="min-h-screen"
      style={{
        background: UI.page,
        color: UI.ink,
      }}
    >
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-10">
        <div
          className="overflow-hidden rounded-[36px] border shadow-sm"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            className="p-6 text-center md:p-10"
            style={{
              background:
                "linear-gradient(135deg, #fff7ed 0%, #ffffff 52%, #ecfdf5 100%)",
            }}
          >
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
              style={{
                background: UI.green,
                boxShadow: "0 18px 42px rgba(22, 163, 74, 0.25)",
              }}
            >
              <CheckCircle2 size={46} />
            </div>

            <p
              className="mt-6 text-xs font-black uppercase tracking-[0.28em]"
              style={{ color: UI.orange }}
            >
              Booking Received
            </p>

            <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
              ได้รับข้อมูลการจองเรียบร้อยแล้ว
            </h1>

            <p
              className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-7 md:text-base"
              style={{ color: UI.muted }}
            >
              รายการนี้ยังไม่ใช่การยืนยันการจอง ระบบจะยืนยันหลังจากแอดมินตรวจสอบการชำระเงินเรียบร้อยแล้ว
            </p>

            <div
              className="mx-auto mt-6 max-w-3xl rounded-[26px] border p-4 text-left"
              style={{
                background: UI.cream,
                borderColor: "#fed7aa",
              }}
            >
              <div className="flex gap-3">
                <AlertCircle
                  className="mt-1 shrink-0"
                  size={22}
                  color={UI.orange}
                />

                <div>
                  <p className="font-black">หมายเหตุสำคัญ</p>
                  <p
                    className="mt-1 text-sm font-semibold leading-6"
                    style={{ color: UI.muted }}
                  >
                    กรุณาชำระเงินและแจ้งหลักฐานภายในเวลาที่กำหนด หากเลยเวลา
                    ระบบอาจปล่อยห้องให้ลูกค้าท่านอื่น
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/booking"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black transition hover:scale-[1.02]"
                style={{
                  background: UI.black,
                  color: "#ffffff",
                }}
              >
                <ArrowLeft size={18} />
                กลับไปหน้าจอง
              </Link>

              <Link
                href={manageUrl}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white transition hover:scale-[1.02]"
                style={{
                  background: UI.orange,
                  boxShadow: "0 12px 28px rgba(249, 115, 22, 0.24)",
                }}
              >
                <Upload size={18} />
                แจ้งชำระเงิน
              </Link>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
            <aside
              className="border-t p-5 lg:border-r lg:border-t-0 md:p-6"
              style={{ borderColor: UI.line }}
            >
              <p
                className="text-xs font-black uppercase tracking-[0.24em]"
                style={{ color: UI.orange }}
              >
                Payment Info
              </p>

              <h2 className="mt-2 text-2xl font-black">ข้อมูลสำหรับชำระเงิน</h2>

              <div className="mt-5 grid gap-3">
                <InfoCard label="เลขอ้างอิง" value={paymentReference} />
                <InfoCard label="รหัส PIN" value={pinCode} danger />

                <div
                  className="rounded-[26px] p-5"
                  style={{ background: UI.black }}
                >
                  <p className="text-sm font-black text-white/50">
                    ยอดชำระรวม
                  </p>
                  <p
                    className="mt-2 break-words text-4xl font-black"
                    style={{ color: UI.orange }}
                  >
                    ฿{totalAmount.toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyPaymentInfo}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition hover:scale-[1.02]"
                  style={{
                    background: UI.black,
                    color: "#ffffff",
                  }}
                >
                  <Copy size={17} />
                  {copied ? "คัดลอกแล้ว" : "คัดลอกเลขอ้างอิง / PIN"}
                </button>

                <Link
                  href={manageUrl}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:scale-[1.02]"
                  style={{
                    background: UI.orange,
                  }}
                >
                  <Upload size={18} />
                  แจ้งชำระเงิน
                </Link>
              </div>
            </aside>

            <section className="border-t p-5 md:p-6 lg:border-t-0">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-[0.24em]"
                    style={{ color: UI.orange }}
                  >
                    Booking Summary
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    สรุปการจองของคุณ
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-2 md:min-w-[330px]">
                  <SummaryBox label="คืน" value={nights} />
                  <SummaryBox label="ห้อง" value={totalRooms} />
                  <SummaryBox label="คน" value={totalGuests} />
                </div>
              </div>

              {!booking ? (
                <EmptyBooking manageUrl={manageUrl} />
              ) : (
                <div className="mt-6 grid gap-4">
                  {booking.cart.items.map((item, index) => {
                    const guest = booking.guests?.find(
                      (guestItem) => guestItem.roomCartId === item.cartId
                    );

                    return (
                      <BookingItemCard
                        key={item.cartId}
                        index={index}
                        item={item}
                        guest={guest}
                        nights={booking.cart.nights}
                        checkIn={booking.cart.checkIn || item.checkIn}
                        checkOut={booking.cart.checkOut || item.checkOut}
                      />
                    );
                  })}
                </div>
              )}

              <div
                className="mt-6 rounded-[26px] border p-4"
                style={{
                  background: UI.greenSoft,
                  borderColor: "#bbf7d0",
                }}
              >
                <div className="flex gap-3">
                  <ShieldCheck
                    className="mt-1 shrink-0"
                    size={22}
                    color={UI.green}
                  />

                  <div>
                    <p
                      className="font-black"
                      style={{ color: "#15803d" }}
                    >
                      ขั้นตอนถัดไป
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold leading-6"
                      style={{ color: "#15803d" }}
                    >
                      กด “แจ้งชำระเงิน” เพื่ออัปโหลดสลิป หลังจากแอดมินตรวจสอบแล้ว
                      สถานะรายการจะเปลี่ยนเป็นยืนยันการจอง
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className="rounded-[24px] border p-4"
      style={{
        background: UI.cream,
        borderColor: UI.line,
      }}
    >
      <p className="text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>

      <p
        className="mt-2 break-words text-xl font-black leading-tight"
        style={{
          color: danger ? UI.red : UI.ink,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl border p-3 text-center"
      style={{
        background: UI.cream,
        borderColor: UI.line,
      }}
    >
      <p className="text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyBooking({ manageUrl }: { manageUrl: string }) {
  return (
    <div
      className="mt-6 rounded-[28px] border p-8 text-center"
      style={{
        background: "#f8fafc",
        borderColor: "#cbd5e1",
      }}
    >
      <ReceiptText className="mx-auto" size={52} color={UI.orange} />

      <p className="mt-4 text-2xl font-black">ไม่พบข้อมูลการจองในเครื่องนี้</p>

      <p
        className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-7"
        style={{ color: UI.muted }}
      >
        ถ้าเปิดจากอุปกรณ์อื่น ให้ใช้หมายเลขอ้างอิงและ PIN
        เพื่อค้นหารายการในหน้าจัดการ
      </p>

      <Link
        href={manageUrl}
        className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl px-6 text-sm font-black text-white"
        style={{ background: UI.orange }}
      >
        ไปหน้าจัดการ
      </Link>
    </div>
  );
}

function BookingItemCard({
  index,
  item,
  guest,
  nights,
  checkIn,
  checkOut,
}: {
  index: number;
  item: BookingCartItem;
  guest?: BookingGuest;
  nights: number;
  checkIn?: string;
  checkOut?: string;
}) {
  const imageSrc = item.coverImage || item.image || "/images/tent-1.jpg";

  const itemTotal =
    item.totalAmount ||
    Number(item.price || 0) * Number(item.quantity || 1) * Number(nights || 1);

  return (
    <article
      className="overflow-hidden rounded-[28px] border"
      style={{
        background: "#ffffff",
        borderColor: UI.line,
      }}
    >
      <div className="grid gap-4 p-4 md:grid-cols-[150px_1fr_auto] md:items-center">
        <div className="h-36 overflow-hidden rounded-[24px] bg-slate-200 md:h-28">
          <img
            src={imageSrc}
            alt={item.roomName}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>

        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: UI.orange }}
          >
            Room {index + 1}
          </p>

          <h3 className="mt-1 text-2xl font-black">{item.roomName}</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniTag
              icon={<CalendarDays size={15} />}
              text={
                checkIn && checkOut
                  ? `${formatDateShort(checkIn)} - ${formatDateShort(checkOut)}`
                  : `${nights} คืน`
              }
            />

            <MiniTag
              icon={<UsersRound size={15} />}
              text={`ผู้ใหญ่ ${item.adults} เด็ก ${item.children}`}
            />

            <MiniTag
              icon={<ReceiptText size={15} />}
              text={`${item.quantity} ห้อง`}
            />
          </div>
        </div>

        <div
          className="rounded-[24px] px-5 py-4 text-left md:min-w-[150px] md:text-right"
          style={{
            background: UI.black,
            color: "#ffffff",
          }}
        >
          <p className="text-xs font-bold text-white/55">ยอดรายการ</p>
          <p
            className="mt-1 text-2xl font-black"
            style={{ color: UI.orange }}
          >
            ฿{itemTotal.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        className="grid gap-3 border-t p-4 md:grid-cols-3"
        style={{ borderColor: UI.line }}
      >
        <CleanInfo
          icon={<UserRound size={18} />}
          label="ชื่อผู้เข้าพัก"
          value={guest?.guestName || "-"}
        />

        <CleanInfo
          icon={<CreditCard size={18} />}
          label="สัญชาติ"
          value={guest?.nationality || "-"}
        />

        <CleanInfo
          icon={<CalendarDays size={18} />}
          label="ถึงที่พักประมาณ"
          value={guest?.arrivalTime || "-"}
        />
      </div>

      {guest?.note && (
        <div className="px-4 pb-4">
          <div
            className="rounded-[22px] p-4"
            style={{
              background: UI.cream,
            }}
          >
            <p className="text-xs font-black" style={{ color: UI.muted }}>
              หมายเหตุ
            </p>
            <p className="mt-1 text-sm font-semibold leading-6">
              {guest.note}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}

function MiniTag({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
      style={{
        background: UI.cream,
        color: UI.ink,
        border: `1px solid ${UI.line}`,
      }}
    >
      <span style={{ color: UI.orange }}>{icon}</span>
      {text}
    </span>
  );
}

function CleanInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[22px] border p-4"
      style={{
        background: "#f8fafc",
        borderColor: "#e2e8f0",
      }}
    >
      <div className="flex items-center gap-2" style={{ color: UI.orange }}>
        {icon}
        <p className="text-xs font-black" style={{ color: UI.muted }}>
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function formatDateShort(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
