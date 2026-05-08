"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
} from "lucide-react";

type RoomType = {
  id: string;
  name: string;
  is_active?: boolean;
};

type RoomUnit = {
  id: string;
  room_type_id: string;
  name: string;
  status: string;
};

type Booking = {
  id: string;
  check_in?: string;
  check_out?: string;
  booking_status?: string;
  payment_status?: string;
  cart_data?: {
    items?: {
      roomTypeId?: string;
      room_type_id?: string;
      roomName?: string;
      quantity?: number;
    }[];
  } | null;
};

type ApiBookingsResponse = {
  bookings?: Booking[];
};

type ApiRoomUnitsResponse = {
  roomUnits?: RoomUnit[];
  rooms?: RoomType[];
};

const UI = {
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
  yellowSoft: "#fffbeb",
};

const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default function AdminCalendarPage() {
  const [roomUnits, setRoomUnits] = useState<RoomUnit[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  function getToken() {
    if (typeof window === "undefined") return "admin-local-session";
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadData() {
    setLoading(true);

    try {
      const [unitRes, bookingRes] = await Promise.all([
        fetch("/api/admin/room-units", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          cache: "no-store",
        }),
        fetch("/api/admin/bookings?status=ALL", {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          cache: "no-store",
        }),
      ]);

      const unitJson = (await unitRes.json()) as ApiRoomUnitsResponse;
      const bookingJson = (await bookingRes.json()) as ApiBookingsResponse;

      setRoomUnits(unitJson.roomUnits || []);
      setRooms(unitJson.rooms || []);
      setBookings(bookingJson.bookings || []);
    } catch (error) {
      console.error("LOAD_ADMIN_CALENDAR_ERROR", error);
      alert("โหลดปฏิทินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const calendarDays = useMemo(() => getCalendarDays(monthDate), [monthDate]);

  const totalActiveUnits = useMemo(() => {
    return roomUnits.filter((unit) => unit.status === "AVAILABLE").length;
  }, [roomUnits]);

  function getBookedCount(dateString: string) {
    return bookings.reduce((sum, booking) => {
      const active =
        booking.booking_status !== "CANCELLED" &&
        booking.payment_status !== "CANCELLED";

      if (!active) return sum;

      const checkIn = booking.check_in || "";
      const checkOut = booking.check_out || "";

      if (!checkIn || !checkOut) return sum;

      const isInRange = checkIn <= dateString && checkOut > dateString;

      if (!isInRange) return sum;

      const qty =
        booking.cart_data?.items?.reduce((itemSum, item) => {
          return itemSum + Number(item.quantity || 0);
        }, 0) || 0;

      return sum + qty;
    }, 0);
  }

  function prevMonth() {
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
    );
  }

  return (
    <div className="grid gap-7">
      <section
        className="relative overflow-hidden rounded-[42px] border p-7 md:p-9"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #181818 56%, #321807 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: UI.orange }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                background: "rgba(249,115,22,0.13)",
                color: UI.orange,
                border: "1px solid rgba(249,115,22,0.35)",
              }}
            >
              <CalendarDays size={16} />
              Availability Calendar
            </div>

            <h1 className="mt-5 text-4xl font-black md:text-5xl">
              ปฏิทินห้องว่าง
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              ดูจำนวนห้องว่างรวมรายวัน อิงจาก room_units และรายการจองในฐานข้อมูล
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="ยูนิตว่าง" value={totalActiveUnits} />
            <HeroStat label="ประเภทห้อง" value={rooms.length} />
            <HeroStat label="รายการจอง" value={bookings.length} />
          </div>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-[36px] border shadow-sm"
        style={{
          background: UI.paper,
          borderColor: UI.line,
          boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
        }}
      >
        <div
          className="border-b p-5"
          style={{
            borderColor: UI.line,
            background:
              "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.22em]"
                style={{ color: UI.orange }}
              >
                Calendar
              </p>
              <h2 className="mt-2 text-3xl font-black">
                {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
              </h2>
              <p className="mt-1 text-sm font-semibold" style={{ color: UI.muted }}>
                ห้องว่างรวมทั้งหมด {totalActiveUnits} ยูนิต
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white"
                style={{ background: UI.black }}
              >
                <ChevronLeft size={18} />
                เดือนก่อน
              </button>

              <button
                type="button"
                onClick={nextMonth}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white"
                style={{ background: UI.orange }}
              >
                เดือนถัดไป
                <ChevronRight size={18} />
              </button>

              <button
                type="button"
                onClick={loadData}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
                style={{
                  background: UI.paper,
                  borderColor: UI.line,
                  color: UI.black,
                }}
              >
                <RefreshCcw size={18} />
                รีเฟรช
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[520px] items-center justify-center">
            <div className="text-center">
              <Loader2
                className="mx-auto animate-spin"
                size={48}
                color={UI.orange}
              />
              <p className="mt-4 text-2xl font-black">กำลังโหลดปฏิทิน</p>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div
              className="overflow-hidden rounded-[30px] border"
              style={{ borderColor: UI.line }}
            >
              <div className="grid grid-cols-7">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="py-4 text-center text-sm font-black text-white"
                    style={{ background: UI.black }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const booked = day.inMonth ? getBookedCount(day.dateString) : 0;
                  const available = Math.max(totalActiveUnits - booked, 0);
                  const full = day.inMonth && available <= 0;

                  return (
                    <div
                      key={day.dateString}
                      className="min-h-[125px] border p-3"
                      style={{
                        borderColor: UI.line,
                        background: !day.inMonth
                          ? "#f1f5f9"
                          : full
                          ? UI.redSoft
                          : available <= 3
                          ? UI.yellowSoft
                          : UI.greenSoft,
                      }}
                    >
                      <p
                        className="text-xl font-black"
                        style={{
                          color: day.inMonth ? UI.black : "#94a3b8",
                        }}
                      >
                        {day.day}
                      </p>

                      {day.inMonth && (
                        <div className="mt-4 grid gap-1">
                          <p
                            className="rounded-full px-2 py-1 text-xs font-black"
                            style={{
                              background: "#ffffff",
                              color: full ? UI.red : UI.green,
                            }}
                          >
                            ว่าง {available}
                          </p>
                          <p
                            className="rounded-full px-2 py-1 text-xs font-black"
                            style={{
                              background: "#ffffff",
                              color: UI.orange,
                            }}
                          >
                            จอง {booked}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">
              <Legend color={UI.greenSoft} text="ว่างเยอะ" />
              <Legend color={UI.yellowSoft} text="เหลือน้อย" />
              <Legend color={UI.redSoft} text="เต็ม" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
      <p className="text-sm font-black text-white/55">{label}</p>
      <p className="mt-2 text-4xl font-black" style={{ color: UI.orange }}>
        {value}
      </p>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-4 w-4 rounded-full border"
        style={{
          background: color,
          borderColor: UI.line,
        }}
      />
      {text}
    </span>
  );
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();

  const startDate = new Date(year, month, 1 - startWeekDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      dateString: toDateString(date),
    };
  });
}

function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}