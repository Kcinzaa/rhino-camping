import {
  adminUnauthorized,
  isAdminRequest,
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    bookingId: string;
  }>;
};

type AdminBookingAction =
  | "CONFIRM_PAYMENT"
  | "REJECT_PAYMENT"
  | "CANCEL_BOOKING"
  | "MARK_WAITING_PAYMENT";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function findBookingByAnyKey(bookingId: string) {
  const key = decodeURIComponent(bookingId).trim();

  if (!key) {
    return {
      data: null,
      error: {
        message: "Missing bookingId",
      },
    };
  }

  if (isUuid(key)) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", key)
      .maybeSingle();

    return { data, error };
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .or(`payment_reference.eq.${key},booking_no.eq.${key}`)
    .maybeSingle();

  return { data, error };
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { bookingId } = await context.params;

    const { data, error } = await findBookingByAnyKey(bookingId);

    if (error) {
      console.error("ADMIN_GET_BOOKING_DETAIL_SUPABASE_ERROR", error);

      return Response.json(
        {
          message: "โหลดรายละเอียดการจองไม่สำเร็จ",
          error: error.message || "Supabase error",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return Response.json(
        {
          message: "ไม่พบรายการจอง",
          error: "BOOKING_NOT_FOUND",
          bookingId,
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      booking: data,
    });
  } catch (error) {
    console.error("ADMIN_GET_BOOKING_DETAIL_ERROR", error);

    return Response.json(
      {
        message: "โหลดรายละเอียดการจองไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { bookingId } = await context.params;
    const body = await request.json();

    const action = body.action as AdminBookingAction;

    const found = await findBookingByAnyKey(bookingId);

    if (found.error) {
      console.error("ADMIN_FIND_BOOKING_BEFORE_UPDATE_ERROR", found.error);

      return Response.json(
        {
          message: "ค้นหารายการจองไม่สำเร็จ",
          error: found.error.message || "Supabase error",
        },
        {
          status: 500,
        }
      );
    }

    if (!found.data) {
      return Response.json(
        {
          message: "ไม่พบรายการจอง",
          error: "BOOKING_NOT_FOUND",
          bookingId,
        },
        {
          status: 404,
        }
      );
    }

    const booking = found.data;

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === "CONFIRM_PAYMENT") {
      updateData = {
        ...updateData,
        payment_status: "PAID",
        booking_status: "CONFIRMED",
      };
    }

    if (action === "REJECT_PAYMENT") {
      updateData = {
        ...updateData,
        payment_status: "WAITING_PAYMENT",
        booking_status: "PENDING_PAYMENT",
        payment_slip_url: null,
        payment_slip_path: null,
      };
    }

    if (action === "CANCEL_BOOKING") {
      updateData = {
        ...updateData,
        payment_status: "CANCELLED",
        booking_status: "CANCELLED",
      };
    }

    if (action === "MARK_WAITING_PAYMENT") {
      updateData = {
        ...updateData,
        payment_status: "WAITING_PAYMENT",
        booking_status: "PENDING_PAYMENT",
      };
    }

    if (!action) {
      return Response.json(
        {
          message: "Missing action",
          error: "MISSING_ACTION",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", booking.id)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN_UPDATE_BOOKING_SUPABASE_ERROR", error);

      return Response.json(
        {
          message: "อัปเดตรายการไม่สำเร็จ",
          error: error.message || "Supabase error",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      message: "อัปเดตรายการสำเร็จ",
      booking: data,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_BOOKING_ERROR", error);

    return Response.json(
      {
        message: "อัปเดตรายการไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}