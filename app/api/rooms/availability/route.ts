import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomAvailability = {
  id: string;
  name: string;
  description?: string | null;
  capacity?: number;
  total_units?: number;
  available_rooms?: number;
  availableRooms?: number;
  locked_rooms?: number;
  maintenance_rooms?: number;
  real_booked_rooms?: number;
  booked_rooms?: number;
  cover_image?: string | null;
};

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const checkIn = url.searchParams.get("checkIn") || "";
    const checkOut = url.searchParams.get("checkOut") || "";

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { success: false, message: "checkIn and checkOut are required" },
        { status: 400 }
      );
    }

    const roomsUrl = new URL("/api/rooms", url.origin);
    roomsUrl.searchParams.set("checkIn", checkIn);
    roomsUrl.searchParams.set("checkOut", checkOut);

    const response = await fetch(roomsUrl, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    const data = ((result.rooms || []) as RoomAvailability[]).map((room) => {
      const availableRooms = asNumber(room.available_rooms ?? room.availableRooms);
      const totalRooms = asNumber(room.total_units);
      const reservedRooms = asNumber(room.locked_rooms) + asNumber(room.maintenance_rooms);
      const realBookedRooms = asNumber(room.real_booked_rooms);
      const bookedRooms = asNumber(room.booked_rooms);

      return {
        id: room.id,
        name: room.name,
        description: room.description || null,
        capacity: room.capacity,
        totalRooms,
        reservedRooms,
        imageUrl: room.cover_image || null,
        realBookedRooms,
        bookedRooms,
        availableRooms,
        isAvailable: availableRooms > 0,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      summary: {
        checkIn,
        checkOut,
        totalRoomTypes: data.length,
        totalHeldBookings: data.reduce((sum, room) => sum + room.bookedRooms, 0),
      },
    });
  } catch (error) {
    console.error("GET ROOM AVAILABILITY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Cannot load room availability",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
