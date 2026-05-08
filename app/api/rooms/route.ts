import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomUnit = {
  id: string;
  name: string;
  status: string;
};

type PackageRate = {
  id: string;
  brand?: string;
  day_type: string;
  price_per_person: number;
};

type RoomType = {
  id: string;
  name: string;
  slug: string;
  category: string;
  capacity: number;
  unit_label: string;
  description: string;
  cover_image: string;
  gallery_images?: string[] | null;
  is_pet_allowed?: boolean;
  is_active: boolean;
  sell_on_rhino?: boolean;
  sell_on_gorilla?: boolean;
  room_units?: RoomUnit[];
  package_rates?: PackageRate[];
  room_rates?: PackageRate[];
};

type GorillaAvailabilityRoom = {
  id: number;
  availableRooms?: number;
  totalRooms?: number;
  bookedRooms?: number;
  realBookedRooms?: number;
  reservedRooms?: number;
};

type BookingCartItem = {
  roomTypeId?: string;
  room_type_id?: string;
  roomSlug?: string;
  room_slug?: string;
  slug?: string;
  quantity?: number;
};

type BookingRow = {
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    items?: BookingCartItem[];
  } | null;
};

type GorillaRoomSync = {
  availableRooms: number;
  totalRooms: number;
  bookedRooms: number;
  realBookedRooms: number;
  reservedRooms: number;
};

function isRhinoRoom(room: RoomType) {
  const slug = String(room.slug || "").toLowerCase();
  const name = String(room.name || "").toLowerCase();

  if (room.sell_on_rhino === false) return false;
  if (slug === "gorilla-king-double" || slug === "gorilla-king-single") {
    return false;
  }
  if (name === "king size room double" || name === "king size room single") {
    return false;
  }

  return true;
}

function overlaps(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  rangeStart: string,
  rangeEnd: string
) {
  if (!checkIn || !checkOut) return false;
  return checkIn < rangeEnd && checkOut > rangeStart;
}

function getGorillaBaseUrl() {
  return (
    process.env.GORILLA_BASE_URL ||
    process.env.GORILLA_SITE_URL ||
    process.env.NEXT_PUBLIC_GORILLA_BASE_URL ||
    process.env.NEXT_PUBLIC_GORILLA_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

function mapGorillaRoomIdToRhinoSlug(roomId: number) {
  if (roomId === 1) return "resort-2-person";
  if (roomId === 5) return "gorilla-king-double";
  if (roomId === 6) return "gorilla-king-single";

  return "";
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

async function getGorillaAvailabilityBySlug(checkIn: string, checkOut: string) {
  const baseUrl = getGorillaBaseUrl();

  if (!baseUrl || !checkIn || !checkOut) {
    return new Map<string, GorillaRoomSync>();
  }

  try {
    const url = new URL("/api/rooms/availability", baseUrl);
    url.searchParams.set("checkIn", checkIn);
    url.searchParams.set("checkOut", checkOut);

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      console.error("GET_GORILLA_AVAILABILITY_FAILED", {
        status: response.status,
        url: url.toString(),
      });
      return new Map<string, GorillaRoomSync>();
    }

    const result = await response.json();
    const rooms = (result.data || []) as GorillaAvailabilityRoom[];
    const map = new Map<string, GorillaRoomSync>();

    rooms.forEach((room) => {
      const slug = mapGorillaRoomIdToRhinoSlug(Number(room.id));

      if (!slug) return;

      map.set(slug, {
        availableRooms: asNumber(room.availableRooms),
        totalRooms: asNumber(room.totalRooms),
        bookedRooms: asNumber(room.bookedRooms),
        realBookedRooms: asNumber(room.realBookedRooms),
        reservedRooms: asNumber(room.reservedRooms),
      });
    });

    return map;
  } catch (error) {
    console.error("GET_GORILLA_AVAILABILITY_ERROR", error);
    return new Map<string, GorillaRoomSync>();
  }
}

function getBookingRoomKey(
  item: BookingCartItem,
  roomIdBySlug: Map<string, string>
) {
  const directId = item.roomTypeId || item.room_type_id;

  if (directId) return directId;

  const slug = String(item.roomSlug || item.room_slug || item.slug || "")
    .trim()
    .toLowerCase();

  if (!slug) return "";

  return roomIdBySlug.get(slug) || "";
}

function getBookedCountByRoom(
  bookings: BookingRow[],
  checkIn: string,
  checkOut: string,
  roomIdBySlug: Map<string, string>
) {
  const map = new Map<string, number>();

  bookings.forEach((booking) => {
    const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
    const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;

    if (!overlaps(bookingCheckIn, bookingCheckOut, checkIn, checkOut)) return;

    booking.cart_data?.items?.forEach((item) => {
      const roomTypeId = getBookingRoomKey(item, roomIdBySlug);

      if (!roomTypeId) return;

      const current = map.get(roomTypeId) || 0;
      map.set(roomTypeId, current + Math.max(Number(item.quantity || 1), 1));
    });
  });

  return map;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn") || "";
    const checkOut = searchParams.get("checkOut") || "";

    const { data, error } = await supabaseAdmin
      .from("room_types")
      .select(`
        *,
        room_units (
          id,
          name,
          status
        ),
        package_rates (
          id,
          brand,
          day_type,
          price_per_person
        ),
        room_rates (
          id,
          day_type,
          price_per_person
        )
      `)
      .eq("is_active", true)
      .eq("sell_on_rhino", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("GET_RHINO_ROOMS_ERROR", error);

      return NextResponse.json(
        {
          message: "โหลดข้อมูลห้องไม่สำเร็จ",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const allRooms = ((data || []) as RoomType[]).filter(isRhinoRoom);
    const roomIdBySlug = new Map(
      allRooms.map((room) => [String(room.slug || "").toLowerCase(), room.id])
    );
    const gorillaAvailabilityBySlug =
      checkIn && checkOut
        ? await getGorillaAvailabilityBySlug(checkIn, checkOut)
        : new Map<string, GorillaRoomSync>();
    let bookedCountByRoom = new Map<string, number>();

    if (checkIn && checkOut) {
      const { data: bookings, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("check_in, check_out, booking_status, payment_status, cart_data")
        .neq("booking_status", "CANCELLED")
        .lt("check_in", checkOut)
        .gt("check_out", checkIn);

      if (bookingError) {
        console.error("GET_RHINO_ROOM_BOOKINGS_ERROR", bookingError);
      } else {
        bookedCountByRoom = getBookedCountByRoom(
          (bookings || []) as BookingRow[],
          checkIn,
          checkOut,
          roomIdBySlug
        );
      }
    }

    const rooms = allRooms.map((room) => {
      const units = room.room_units || [];

      const totalUnits = units.length;

      const lockedUnits = units.filter((unit) => {
        return unit.status === "LOCKED";
      }).length;

      const maintenanceUnits = units.filter((unit) => {
        return unit.status === "MAINTENANCE" || unit.status === "DISABLED";
      }).length;

      const availableUnits = units.filter((unit) => {
        return unit.status === "AVAILABLE";
      }).length;

      const packageRates = (room.package_rates || []).filter((rate) => {
        return rate.brand === "RHINO";
      });
      const fallbackRoomRates = room.room_rates || [];
      const rhinoRates = packageRates.length > 0 ? packageRates : fallbackRoomRates;

      const bookedRooms = bookedCountByRoom.get(room.id) || 0;
      const centralAvailableUnits = Math.max(availableUnits - bookedRooms, 0);
      const gorillaAvailability = gorillaAvailabilityBySlug.get(
        String(room.slug || "").toLowerCase()
      );
      const dateAvailableUnits = gorillaAvailability
        ? Math.min(centralAvailableUnits, gorillaAvailability.availableRooms)
        : centralAvailableUnits;
      const externalBookedRooms = gorillaAvailability
        ? Math.max(
            gorillaAvailability.bookedRooms,
            gorillaAvailability.totalRooms - gorillaAvailability.availableRooms,
            0
          )
        : 0;

      const weekdayPrice =
        rhinoRates.find((rate) => rate.day_type === "WEEKDAY")
          ?.price_per_person || 0;

      const weekendPrice =
        rhinoRates.find((rate) => rate.day_type === "WEEKEND")
          ?.price_per_person || 0;

      return {
        ...room,
        total_units: totalUnits,
        available_rooms: dateAvailableUnits,
        availableRooms: dateAvailableUnits,
        locked_rooms: lockedUnits,
        maintenance_rooms: maintenanceUnits,
        real_booked_rooms: Math.max(bookedRooms, gorillaAvailability?.realBookedRooms || 0),
        external_booked_rooms: externalBookedRooms,
        external_available_rooms: gorillaAvailability?.availableRooms ?? null,
        external_total_rooms: gorillaAvailability?.totalRooms ?? null,
        availability_source: gorillaAvailability ? "CENTRAL_AND_GORILLA" : "CENTRAL",
        booked_rooms: Math.max(bookedRooms, externalBookedRooms) + lockedUnits + maintenanceUnits,
        package_rates: rhinoRates,
        room_rates: rhinoRates,
        weekday_price: weekdayPrice,
        weekend_price: weekendPrice,
        min_price: weekdayPrice || weekendPrice || 0,
      };
    });

    return NextResponse.json({
      rooms,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("GET_RHINO_ROOMS_UNKNOWN_ERROR", error);

    return NextResponse.json(
      {
        message: "โหลดข้อมูลห้องไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
