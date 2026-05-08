import { adminUnauthorized, isAdminRequest, supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isRhinoRoom(room: { name?: string | null; slug?: string | null; sell_on_rhino?: boolean | null }) {
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

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, booking_status, payment_status, total_amount, created_at");

    if (bookingError) throw bookingError;

    const { data: rooms, error: roomError } = await supabaseAdmin
      .from("room_types")
      .select("id, name, slug, is_active, sell_on_rhino")
      .eq("sell_on_rhino", true);

    if (roomError) throw roomError;

    const totalBookings = bookings?.length || 0;
    const waitingPayment =
      bookings?.filter((item) => item.payment_status === "WAITING_PAYMENT").length || 0;
    const waitingVerify =
      bookings?.filter((item) => item.payment_status === "WAITING_VERIFY").length || 0;
    const confirmed =
      bookings?.filter(
        (item) => item.booking_status === "CONFIRMED" || item.payment_status === "PAID"
      ).length || 0;
    const cancelled =
      bookings?.filter((item) => item.booking_status === "CANCELLED").length || 0;

    const revenue =
      bookings
        ?.filter(
          (item) => item.booking_status === "CONFIRMED" || item.payment_status === "PAID"
        )
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0) || 0;

    const rhinoRooms = (rooms || []).filter(isRhinoRoom);

    return Response.json({
      stats: {
        totalBookings,
        waitingPayment,
        waitingVerify,
        confirmed,
        cancelled,
        revenue,
        totalRoomTypes: rhinoRooms.length,
        activeRoomTypes: rhinoRooms.filter((item) => item.is_active).length,
      },
    });
  } catch (error) {
    console.error("ADMIN_STATS_ERROR", error);

    return Response.json(
      {
        message: "โหลดสถิติไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
