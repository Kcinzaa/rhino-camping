import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GroupBenefitLevel = "NONE" | "KARAOKE" | "PARTY";

type BookingRow = {
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  total_adults?: number | null;
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    groupBenefit?: {
      level?: GroupBenefitLevel;
      assigned?: boolean;
    } | null;
    items?: {
      adults?: number;
      quantity?: number;
    }[];
  } | null;
};

const LIMITS = {
  karaoke: 2,
  party: 2,
} as const;

function overlaps(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  rangeStart: string,
  rangeEnd: string
) {
  if (!checkIn || !checkOut) return false;
  return checkIn < rangeEnd && checkOut > rangeStart;
}

function isActiveBooking(booking: BookingRow) {
  const bookingStatus = String(booking.booking_status || "").toUpperCase();
  const paymentStatus = String(booking.payment_status || "").toUpperCase();

  return (
    bookingStatus !== "CANCELLED" &&
    bookingStatus !== "REJECTED" &&
    paymentStatus !== "CANCELLED" &&
    paymentStatus !== "REJECTED" &&
    paymentStatus !== "EXPIRED"
  );
}

function getAdults(booking: BookingRow) {
  if (typeof booking.total_adults === "number") return booking.total_adults;

  return (booking.cart_data?.items || []).reduce((sum, item) => {
    return sum + Number(item.adults || 0) * Number(item.quantity || 1);
  }, 0);
}

function getBenefitLevel(booking: BookingRow): GroupBenefitLevel {
  const benefit = booking.cart_data?.groupBenefit;

  if (benefit?.assigned === false) return "NONE";
  if (benefit?.level === "KARAOKE" || benefit?.level === "PARTY") {
    return benefit.level;
  }

  // Legacy fallback for old bookings created before groupBenefit was saved.
  const adults = getAdults(booking);
  if (adults >= 10) return "PARTY";
  if (adults >= 6) return "KARAOKE";
  return "NONE";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { message: "checkIn and checkOut are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("check_in, check_out, booking_status, payment_status, total_adults, cart_data")
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    if (error) {
      console.error("GET_GROUP_BENEFIT_AVAILABILITY_ERROR", error);
      return NextResponse.json(
        { message: "Load group benefit availability failed", error: error.message },
        { status: 500 }
      );
    }

    const used = {
      karaoke: 0,
      party: 0,
    };

    ((data || []) as BookingRow[]).forEach((booking) => {
      const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
      const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;

      if (!isActiveBooking(booking)) return;
      if (!overlaps(bookingCheckIn, bookingCheckOut, checkIn, checkOut)) return;

      const level = getBenefitLevel(booking);
      if (level === "KARAOKE") used.karaoke += 1;
      if (level === "PARTY") used.party += 1;
    });

    return NextResponse.json(
      {
        checkIn,
        checkOut,
        limits: LIMITS,
        used,
        remaining: {
          karaoke: Math.max(LIMITS.karaoke - used.karaoke, 0),
          party: Math.max(LIMITS.party - used.party, 0),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET_GROUP_BENEFIT_AVAILABILITY_UNKNOWN_ERROR", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
