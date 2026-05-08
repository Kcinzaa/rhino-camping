import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DayAvailability = {
  date: string;
  day: number;
  available: number;
  booked: number;
  total: number;
  status: "available" | "almost" | "busy" | "full" | "noPrice";
  isWeekend: boolean;
  isHoliday: boolean;
};

type RoomAvailability = {
  id: string;
  name: string;
  total_units?: number;
  available_rooms?: number;
  availableRooms?: number;
  booked_rooms?: number;
};

function toDateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getStatus(available: number, total: number): DayAvailability["status"] {
  if (total <= 0) return "noPrice";
  if (available <= 0) return "full";
  if (available <= Math.ceil(total * 0.25)) return "busy";
  if (available <= Math.ceil(total * 0.5)) return "almost";
  return "available";
}

function isThaiLongHoliday(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const holidays = ["01-01", "04-13", "04-14", "04-15", "05-01", "12-05", "12-10", "12-31"];

  return holidays.includes(`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

async function loadRoomAvailability({
  origin,
  roomId,
  roomName,
  checkIn,
  checkOut,
}: {
  origin: string;
  roomId: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
}) {
  const roomsUrl = new URL("/api/rooms", origin);
  roomsUrl.searchParams.set("checkIn", checkIn);
  roomsUrl.searchParams.set("checkOut", checkOut);

  const response = await fetch(roomsUrl, { cache: "no-store" });
  const result = await response.json();

  if (!response.ok) throw new Error(result.message || "Cannot load rooms");

  return ((result.rooms || []) as RoomAvailability[]).find((room) => {
    if (roomId && String(room.id) === roomId) return true;
    return room.name === roomName;
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const roomId = searchParams.get("roomId") || "";
    const roomName = searchParams.get("roomName") || "";
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!year || !month) {
      return NextResponse.json(
        { ok: false, message: "year and month are required" },
        { status: 400 }
      );
    }

    const daysInMonth = getDaysInMonth(year, month);
    const days: DayAvailability[] = [];

    for (let index = 0; index < daysInMonth; index += 1) {
      const day = index + 1;
      const currentDate = new Date(year, month - 1, day);
      const currentDateText = toDateOnly(currentDate);
      const nextDateText = addDays(currentDateText, 1);
      const room = await loadRoomAvailability({
        origin,
        roomId,
        roomName,
        checkIn: currentDateText,
        checkOut: nextDateText,
      });

      const total = asNumber(room?.total_units);
      const available = asNumber(room?.available_rooms ?? room?.availableRooms);
      const booked = Math.max(total - available, 0);
      const weekDay = currentDate.getDay();

      days.push({
        date: currentDateText,
        day,
        available,
        booked,
        total,
        status: getStatus(available, total),
        isWeekend: weekDay === 0 || weekDay === 6,
        isHoliday: isThaiLongHoliday(currentDate),
      });
    }

    return NextResponse.json({
      ok: true,
      roomId,
      roomName,
      year,
      month,
      days,
    });
  } catch (error) {
    console.error("Availability API error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Cannot load availability",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
