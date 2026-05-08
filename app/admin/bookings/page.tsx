"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

type BookingCartItem = {
  roomName?: string;
  quantity?: number;
  adults?: number;
  children?: number;
  totalGuests?: number;
  totalAmount?: number;
};

type BookingRow = {
  id: string;
  booking_no: string;
  payment_reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  total_rooms: number;
  total_guests: number;
  payment_status: string;
  booking_status: string;
  payment_slip_url?: string | null;
  payment_slip_path?: string | null;
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    items?: BookingCartItem[];
  } | null;
  created_at: string;
};

type ApiBookingsResponse = {
  bookings?: BookingRow[];
  message?: string;
  error?: string;
};

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  orangeSoft: "#fff7ed",
  line: "#e8ddd0",
  muted: "#64748b",
  green: "#16a34a",
  greenSoft: "#ecfdf5",
  red: "#dc2626",
  redSoft: "#fff1f2",
  blueSoft: "#f8fafc",
  yellowSoft: "#fffbeb",
};

const statusTabs = [
  {
    label: "ทั้งหมด",
    value: "ALL",
    icon: ReceiptText,
  },
  {
    label: "รอชำระเงิน",
    value: "WAITING_PAYMENT",
    icon: Clock3,
  },
  {
    label: "รอตรวจสลิป",
    value: "WAITING_VERIFY",
    icon: WalletCards,
  },
  {
    label: "ยืนยันแล้ว",
    value: "CONFIRMED",
    icon: CheckCircle2,
  },
  {
    label: "ยกเลิก",
    value: "CANCELLED",
    icon: XCircle,
  },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function getToken() {
    if (typeof window === "undefined") return "admin-local-session";
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadBookings() {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("status", status);

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      const response = await fetch(`/api/admin/bookings?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiBookingsResponse;

      if (!response.ok) {
        alert(result.message || result.error || "โหลดรายการจองไม่สำเร็จ");
        return;
      }

      setBookings(Array.isArray(result.bookings) ? result.bookings : []);
    } catch (error) {
      console.error("ADMIN_LOAD_BOOKINGS_ERROR", error);
      alert("โหลดรายการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshBookings() {
    setRefreshing(true);
    await loadBookings();
  }

  const summary = useMemo(() => {
    return {
      all: bookings.length,
      waitingPayment: bookings.filter((item) => {
        return (
          item.payment_status === "WAITING_PAYMENT" ||
          item.booking_status === "PENDING_PAYMENT"
        );
      }).length,
      waitingVerify: bookings.filter((item) => {
        return item.payment_status === "WAITING_VERIFY";
      }).length,
      confirmed: bookings.filter((item) => {
        return (
          item.booking_status === "CONFIRMED" || item.payment_status === "PAID"
        );
      }).length,
      cancelled: bookings.filter((item) => {
        return (
          item.booking_status === "CANCELLED" ||
          item.payment_status === "CANCELLED"
        );
      }).length,
      revenue: bookings
        .filter((item) => {
          return (
            item.booking_status === "CONFIRMED" || item.payment_status === "PAID"
          );
        })
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0),
    };
  }, [bookings]);

  return (
    <div className="grid gap-7">
      <section
        className="relative overflow-hidden rounded-[38px] border p-7 md:p-9"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #181818 56%, #321807 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: UI.orange }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                background: "rgba(249,115,22,0.13)",
                color: UI.orange,
                border: "1px solid rgba(249,115,22,0.35)",
              }}
            >
              <ReceiptText size={16} />
              Admin Bookings
            </div>

            <h1 className="mt-5 text-4xl font-black md:text-5xl">
              จัดการรายการจอง
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              ตรวจสอบรายการจองทั้งหมด ค้นหาลูกค้า ดูสถานะการชำระเงิน
              และเข้าไปยืนยันสลิปในหน้ารายละเอียด
            </p>
          </div>

          <div className="rounded-[30px] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-black text-white/55">
              รายได้ที่ยืนยันแล้ว
            </p>

            <p className="mt-2 text-5xl font-black" style={{ color: UI.orange }}>
              ฿{summary.revenue.toLocaleString()}
            </p>

            <p className="mt-2 text-xs font-semibold text-white/50">
              นับเฉพาะรายการที่ยืนยันแล้วหรือชำระแล้ว
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TopStat
          title="ทั้งหมด"
          value={summary.all}
          icon={<ReceiptText size={23} />}
        />

        <TopStat
          title="รอชำระเงิน"
          value={summary.waitingPayment}
          icon={<Clock3 size={23} />}
          orange
        />

        <TopStat
          title="รอตรวจสลิป"
          value={summary.waitingVerify}
          icon={<WalletCards size={23} />}
          orange
        />

        <TopStat
          title="ยืนยันแล้ว"
          value={summary.confirmed}
          icon={<CheckCircle2 size={23} />}
          green
        />

        <TopStat
          title="ยกเลิก"
          value={summary.cancelled}
          icon={<XCircle size={23} />}
          red
        />
      </section>

      <section
        className="overflow-hidden rounded-[36px] border shadow-sm"
        style={{
          background: UI.paper,
          borderColor: UI.line,
          boxShadow: "0 20px 60px rgba(15,23,42,0.07)",
        }}
      >
        <div
          className="border-b p-5 md:p-6"
          style={{
            borderColor: UI.line,
            background:
              "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
          }}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const Icon = tab.icon;
                const active = status === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatus(tab.value)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-sm font-black transition hover:-translate-y-0.5"
                    style={{
                      background: active ? UI.orange : UI.paper,
                      color: active ? "#ffffff" : UI.black,
                      border: `1px solid ${active ? UI.orange : UI.line}`,
                      boxShadow: active
                        ? "0 12px 28px rgba(249,115,22,0.22)"
                        : "none",
                    }}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label
                className="flex h-12 w-full items-center gap-3 rounded-2xl border px-4 sm:min-w-[320px]"
                style={{
                  borderColor: UI.line,
                  background: UI.paper,
                }}
              >
                <Search size={18} color={UI.orange} />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") loadBookings();
                  }}
                  placeholder="ค้นหาเลขจอง / ลูกค้า / เบอร์โทร"
                  className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                />
              </label>

              <button
                type="button"
                onClick={loadBookings}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition hover:scale-[1.02]"
                style={{
                  background: UI.orange,
                  boxShadow: "0 12px 28px rgba(249,115,22,0.20)",
                }}
              >
                <Search size={18} />
                ค้นหา
              </button>

              <button
                type="button"
                onClick={refreshBookings}
                disabled={refreshing}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition disabled:opacity-60"
                style={{
                  background: UI.paper,
                  color: UI.black,
                  borderColor: UI.line,
                }}
              >
                <RefreshCcw
                  size={18}
                  className={refreshing ? "animate-spin" : ""}
                />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto animate-spin" size={48} color={UI.orange} />
            <p className="mt-4 text-2xl font-black">กำลังโหลดรายการจอง</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
              กรุณารอสักครู่
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 p-5 md:p-6">
            {bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const rooms = getRoomsCount(booking);
  const guests = getGuestsCount(booking);
  const adults = getAdultsCount(booking);
  const children = getChildrenCount(booking);
  const firstRoom = getFirstRoomName(booking);
  const statusStyle = getStatusStyle(
    booking.booking_status,
    booking.payment_status
  );
  const statusText = getStatusText(
    booking.booking_status,
    booking.payment_status
  );
  const isWaitingVerify = booking.payment_status === "WAITING_VERIFY";
  const groupBenefit = getGroupBenefit(adults);
  const ref = booking.payment_reference || booking.booking_no || "-";

  return (
    <article
      className="group overflow-hidden rounded-[32px] border bg-white transition hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        borderColor: isWaitingVerify ? "#fed7aa" : UI.line,
        boxShadow: isWaitingVerify
          ? "0 18px 54px rgba(249,115,22,0.10)"
          : "0 14px 46px rgba(15,23,42,0.05)",
      }}
    >
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_260px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
              style={{
                background: statusStyle.bg,
                color: statusStyle.text,
              }}
            >
              {statusStyle.icon}
              {statusText}
            </span>

            {booking.payment_slip_url && (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
                style={{
                  background: UI.greenSoft,
                  color: UI.green,
                }}
              >
                <ShieldCheck size={14} />
                มีสลิปแล้ว
              </span>
            )}

            {groupBenefit.level !== "NONE" && (
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
                style={{
                  background: groupBenefit.level === "PARTY" ? "#fef3c7" : UI.greenSoft,
                  color: groupBenefit.level === "PARTY" ? "#b45309" : UI.green,
                }}
              >
                {groupBenefit.title}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-2xl font-black md:text-3xl">{firstRoom}</h2>

          <div
            className="mt-2 flex flex-wrap items-center gap-2 text-sm font-black"
            style={{ color: UI.muted }}
          >
            <span className="break-all">{ref}</span>
            <span>•</span>
            <span>{booking.customer_name || "-"}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Tag
              icon={<CalendarDays size={15} />}
              text={`${booking.cart_data?.nights || 1} คืน`}
            />
            <Tag icon={<ReceiptText size={15} />} text={`${rooms} ห้อง`} />
            <Tag icon={<UserRound size={15} />} text={`ผู้ใหญ่ ${adults}`} />
            <Tag icon={<UsersRound size={15} />} text={`รวม ${guests} คน`} />
            {children > 0 && (
              <Tag icon={<UsersRound size={15} />} text={`เด็ก ${children}`} />
            )}
          </div>
        </div>

        <div className="grid gap-3 lg:justify-items-end">
          <div className="text-left lg:text-right">
            <p className="text-xs font-black" style={{ color: UI.muted }}>
              ยอดชำระรวม
            </p>

            <p className="mt-1 text-4xl font-black" style={{ color: UI.orange }}>
              ฿{Number(booking.total_amount || 0).toLocaleString()}
            </p>
          </div>

          <Link
            href={`/admin/bookings/${booking.id}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition hover:scale-[1.02]"
            style={{
              background: UI.orange,
              boxShadow: "0 12px 28px rgba(249,115,22,0.22)",
            }}
          >
            <Eye size={18} />
            ดูรายละเอียด / ตรวจสลิป
          </Link>
        </div>
      </div>

      {isWaitingVerify && (
        <div
          className="border-t px-5 py-4 text-sm font-black"
          style={{
            borderColor: "#fed7aa",
            background: UI.orangeSoft,
            color: UI.orange,
          }}
        >
          ลูกค้าอัปโหลดสลิปแล้ว กรุณาเข้าไปตรวจสอบและกดยืนยันห้องพัก
        </div>
      )}
    </article>
  );
}

function TopStat({
  title,
  value,
  icon,
  orange,
  green,
  red,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  orange?: boolean;
  green?: boolean;
  red?: boolean;
}) {
  const color = green ? UI.green : red ? UI.red : orange ? UI.orange : UI.black;
  const bg = green
    ? UI.greenSoft
    : red
      ? UI.redSoft
      : orange
        ? UI.orangeSoft
        : UI.blueSoft;

  return (
    <article
      className="rounded-[30px] border p-5 shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 14px 42px rgba(15,23,42,0.05)",
      }}
    >
      <div
        className="flex h-13 w-13 items-center justify-center rounded-2xl"
        style={{ background: bg, color }}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm font-black" style={{ color: UI.muted }}>
        {title}
      </p>

      <p className="mt-1 text-4xl font-black" style={{ color }}>
        {value}
      </p>
    </article>
  );
}

function Tag({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
      style={{
        background: UI.orangeSoft,
        border: `1px solid ${UI.line}`,
        color: UI.black,
      }}
    >
      <span style={{ color: UI.orange }}>{icon}</span>
      {text}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-20 text-center">
      <div
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: UI.orangeSoft, color: UI.orange }}
      >
        <ReceiptText size={44} />
      </div>

      <h2 className="mt-5 text-3xl font-black">ยังไม่มีรายการจอง</h2>

      <p
        className="mx-auto mt-2 max-w-md text-sm font-semibold leading-7"
        style={{ color: UI.muted }}
      >
        เมื่อมีลูกค้าทำรายการจอง ข้อมูลจะแสดงในหน้านี้โดยอัตโนมัติ
      </p>
    </div>
  );
}

function getRoomsCount(booking: BookingRow) {
  if (booking.cart_data?.items?.length) {
    return booking.cart_data.items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);
  }

  return Number(booking.total_rooms || 0);
}

function getAdultsCount(booking: BookingRow) {
  if (booking.cart_data?.items?.length) {
    return booking.cart_data.items.reduce((sum, item) => {
      return sum + Number(item.adults || 0) * Number(item.quantity || 1);
    }, 0);
  }

  return Number(booking.total_guests || 0);
}

function getChildrenCount(booking: BookingRow) {
  if (booking.cart_data?.items?.length) {
    return booking.cart_data.items.reduce((sum, item) => {
      return sum + Number(item.children || 0) * Number(item.quantity || 1);
    }, 0);
  }

  return 0;
}

function getGuestsCount(booking: BookingRow) {
  if (booking.cart_data?.items?.length) {
    return booking.cart_data.items.reduce((sum, item) => {
      const adults = Number(item.adults || 0) * Number(item.quantity || 1);
      const children = Number(item.children || 0) * Number(item.quantity || 1);

      return sum + adults + children;
    }, 0);
  }

  return Number(booking.total_guests || 0);
}

function getFirstRoomName(booking: BookingRow) {
  const items = booking.cart_data?.items || [];

  if (items.length === 0) return "รายการจอง";

  const first = items[0]?.roomName || "รายการจอง";

  if (items.length === 1) return first;

  return `${first} + อีก ${items.length - 1} รายการ`;
}

function getGroupBenefit(adults: number) {
  if (adults >= 10) {
    return {
      level: "PARTY",
      title: "ฟรีห้องปาร์ตี้",
    };
  }

  if (adults >= 6) {
    return {
      level: "KARAOKE",
      title: "ฟรีคาราโอเกะ",
    };
  }

  return {
    level: "NONE",
    title: "",
  };
}

function getStatusText(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return "ยกเลิกแล้ว";
  }

  if (paymentStatus === "WAITING_VERIFY") {
    return "รอตรวจสลิป";
  }

  if (paymentStatus === "PAID" || bookingStatus === "CONFIRMED") {
    return "ยืนยันแล้ว";
  }

  if (
    paymentStatus === "WAITING_PAYMENT" ||
    bookingStatus === "PENDING_PAYMENT"
  ) {
    return "รอชำระเงิน";
  }

  return "รอดำเนินการ";
}

function getStatusStyle(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return {
      bg: UI.redSoft,
      text: UI.red,
      icon: <XCircle size={14} />,
    };
  }

  if (paymentStatus === "WAITING_VERIFY") {
    return {
      bg: UI.orangeSoft,
      text: UI.orange,
      icon: <AlertCircle size={14} />,
    };
  }

  if (paymentStatus === "PAID" || bookingStatus === "CONFIRMED") {
    return {
      bg: UI.greenSoft,
      text: UI.green,
      icon: <CheckCircle2 size={14} />,
    };
  }

  return {
    bg: UI.yellowSoft,
    text: UI.orange,
    icon: <Clock3 size={14} />,
  };
}