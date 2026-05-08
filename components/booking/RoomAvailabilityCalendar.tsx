"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CalendarDay = {
  date: string;
  day: number;
  available: number;
  booked: number;
  total: number;
  status: "available" | "almost" | "busy" | "full" | "noPrice";
  isWeekend: boolean;
  isHoliday: boolean;
};

type RoomAvailabilityCalendarProps = {
  roomId: string;
  roomName: string;
  totalRooms: number;
  initialYear?: number;
  initialMonth?: number;
};

const thaiDays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function getMonthName(year: number, month: number) {
  return new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

function getPrevMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }

  return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }

  return { year, month: month + 1 };
}

function getStatusClass(status: CalendarDay["status"]) {
  if (status === "available") return "bg-emerald-600 text-white";
  if (status === "almost") return "bg-lime-500 text-white";
  if (status === "busy") return "bg-orange-500 text-white";
  if (status === "full") return "bg-red-600 text-white";
  return "bg-slate-100 text-slate-400";
}

function getStatusLabel(status: CalendarDay["status"]) {
  if (status === "available") return "ว่าง";
  if (status === "almost") return "ค่อนข้างว่าง";
  if (status === "busy") return "ค่อนข้างแน่น";
  if (status === "full") return "เต็ม";
  return "ไม่มีราคา";
}

export default function RoomAvailabilityCalendar({
  roomId,
  roomName,
  totalRooms,
  initialYear,
  initialMonth,
}: RoomAvailabilityCalendarProps) {
  const today = new Date();

  const [year, setYear] = useState(initialYear || today.getFullYear());
  const [month, setMonth] = useState(initialMonth || today.getMonth() + 1);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  const calendarCells = useMemo(() => {
    const previous = getPrevMonth(year, month);
    const previousMonthDays = getDaysInMonth(previous.year, previous.month);

    const beforeCells = Array.from({ length: firstDay }).map((_, index) => ({
      type: "prev" as const,
      day: previousMonthDays - firstDay + index + 1,
    }));

    const currentCells = Array.from({ length: daysInMonth }).map((_, index) => {
      const day = index + 1;
      const found = days.find((item) => item.day === day);

      return {
        type: "current" as const,
        day,
        data: found,
      };
    });

    const totalCells = beforeCells.length + currentCells.length;
    const afterLength = Math.ceil(totalCells / 7) * 7 - totalCells;

    const afterCells = Array.from({ length: afterLength }).map((_, index) => ({
      type: "next" as const,
      day: index + 1,
    }));

    return [...beforeCells, ...currentCells, ...afterCells];
  }, [days, daysInMonth, firstDay, month, year]);

  const totalAvailable = useMemo(() => {
    if (days.length === 0) return totalRooms;

    return Math.max(...days.map((day) => day.available));
  }, [days, totalRooms]);

  useEffect(() => {
    let active = true;

    async function loadAvailability() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          roomId,
          roomName,
          totalRooms: String(totalRooms),
          year: String(year),
          month: String(month),
        });

        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!active) return;

        if (data.ok && Array.isArray(data.days)) {
          setDays(data.days);
        } else {
          setDays(createFallbackDays(year, month, totalRooms));
        }
      } catch {
        if (!active) return;
        setDays(createFallbackDays(year, month, totalRooms));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAvailability();

    return () => {
      active = false;
    };
  }, [month, roomId, roomName, totalRooms, year]);

  function goPrevMonth() {
    const prev = getPrevMonth(year, month);
    setYear(prev.year);
    setMonth(prev.month);
  }

  function goNextMonth() {
    const next = getNextMonth(year, month);
    setYear(next.year);
    setMonth(next.month);
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-[#1f3d2b]">
            สถานะห้องว่าง
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            แสดงจำนวนห้องว่างของเดือนที่เลือก
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-[#f7f1e7] p-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#e97732] shadow-sm transition hover:bg-orange-50"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-[170px] text-center text-base font-black text-[#1f3d2b]">
            {getMonthName(year, month)}
          </div>

          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#e97732] shadow-sm transition hover:bg-orange-50"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-slate-200">
        <div className="grid grid-cols-7 bg-[#1f3d2b] text-center text-sm font-black text-white">
          {thaiDays.map((day) => (
            <div key={day} className="border-r border-white/10 px-2 py-3 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-7">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="rounded-2xl bg-white px-5 py-4 shadow-xl">
                <Loader2 className="mx-auto animate-spin text-[#e97732]" />
                <p className="mt-2 text-sm font-black text-[#1f3d2b]">
                  กำลังโหลดจากฐานข้อมูล
                </p>
              </div>
            </div>
          )}

          {calendarCells.map((cell, index) => {
            if (cell.type !== "current") {
              return (
                <div
                  key={`${cell.type}-${index}`}
                  className="flex min-h-[70px] items-center justify-center border-b border-r border-slate-200 bg-slate-100 text-lg font-semibold text-slate-400"
                >
                  {cell.day}
                </div>
              );
            }

            const data = cell.data;
            const status = data?.status || "noPrice";

            return (
              <div
                key={`current-${cell.day}`}
                className={`relative flex min-h-[70px] flex-col items-center justify-center border-b border-r border-slate-200 ${getStatusClass(status)}`}
                title={
                  data
                    ? `${data.date} | ${getStatusLabel(data.status)} | ว่าง ${data.available}/${data.total} ห้อง`
                    : "ไม่มีข้อมูล"
                }
              >
                <span className="text-lg font-black">{cell.day}</span>

                {data && (
                  <span className="mt-1 text-[11px] font-bold opacity-90">
                    ว่าง {data.available}
                  </span>
                )}

                {data?.isWeekend && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-400" />
                )}

                {data?.isHoliday && (
                  <span className="absolute left-2 top-2 h-2 w-2 rounded-full bg-red-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-black text-slate-600">
        <Legend color="bg-emerald-600" label="ว่าง" />
        <Legend color="bg-lime-500" label="ค่อนข้างว่าง" />
        <Legend color="bg-orange-500" label="ค่อนข้างแน่น" />
        <Legend color="bg-red-600" label="เต็ม" />
        <Legend color="bg-slate-200" label="ไม่มีราคา" />
        <Legend color="bg-sky-400" label="วันสุดสัปดาห์" dot />
        <Legend color="bg-red-400" label="วันหยุดยาว" dot />
      </div>

      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
        <p className="text-sm font-black text-[#1f3d2b]">
          สถานะเดือนนี้: ว่างสูงสุด {totalAvailable} ห้อง
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          ข้อมูลนี้จะอิงจาก Database ผ่าน API `/api/availability` เมื่อมีรายการจองจริง
        </p>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dot,
}: {
  color: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`${color} ${
          dot ? "h-2.5 w-2.5 rounded-full" : "h-3 w-3 rounded"
        }`}
      />
      <span>{label}</span>
    </div>
  );
}

function createFallbackDays(year: number, month: number, totalRooms: number) {
  const daysInMonth = getDaysInMonth(year, month);

  return Array.from({ length: daysInMonth }).map((_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const available = isWeekend
      ? Math.max(totalRooms - 2, 0)
      : totalRooms;

    return {
      date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      available,
      booked: totalRooms - available,
      total: totalRooms,
      status:
        available <= 0
          ? "full"
          : available <= Math.ceil(totalRooms * 0.25)
            ? "busy"
            : available <= Math.ceil(totalRooms * 0.5)
              ? "almost"
              : "available",
      isWeekend,
      isHoliday: false,
    } satisfies CalendarDay;
  });
}