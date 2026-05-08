import { adminUnauthorized, isAdminRequest, supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminBookingAction =
  | "CONFIRM_PAYMENT"
  | "REJECT_PAYMENT"
  | "CANCEL_BOOKING"
  | "MARK_WAITING_PAYMENT";

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

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .or(`id.eq.${key},payment_reference.eq.${key},booking_no.eq.${key}`)
    .maybeSingle();

  return { data, error };
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { searchParams } = new URL(request.url);

    const bookingId = searchParams.get("bookingId");
    const status = searchParams.get("status");
    const keyword = searchParams.get("keyword");

    if (bookingId) {
      const { data, error } = await findBookingByAnyKey(bookingId);

      if (error) {
        return Response.json(
          {
            message: "โหลดรายละเอียดการจองไม่สำเร็จ",
            error: error.message || "Supabase error",
          },
          { status: 500 }
        );
      }

      if (!data) {
        return Response.json(
          {
            message: "ไม่พบรายการจอง",
            error: "BOOKING_NOT_FOUND",
            bookingId,
          },
          { status: 404 }
        );
      }

      return Response.json({
        booking: data,
      });
    }

    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      if (status === "WAITING_VERIFY") {
        query = query.eq("payment_status", "WAITING_VERIFY");
      } else if (status === "WAITING_PAYMENT") {
        query = query.eq("payment_status", "WAITING_PAYMENT");
      } else if (status === "CONFIRMED") {
        query = query.eq("booking_status", "CONFIRMED");
      } else if (status === "CANCELLED") {
        query = query.eq("booking_status", "CANCELLED");
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    let bookings = data || [];

    if (keyword) {
      const key = keyword.toLowerCase();

      bookings = bookings.filter((booking) => {
        const text = [
          booking.booking_no,
          booking.payment_reference,
          booking.customer_name,
          booking.customer_phone,
          booking.customer_email,
          JSON.stringify(booking.cart_data || {}),
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(key);
      });
    }

    return Response.json({
      bookings,
    });
  } catch (error) {
    console.error("ADMIN_GET_BOOKINGS_ERROR", error);

    return Response.json(
      {
        message: "โหลดรายการจองไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId") || "";
    const body = await request.json();
    const action = body.action as AdminBookingAction;

    const found = await findBookingByAnyKey(bookingId);

    if (found.error) {
      return Response.json(
        {
          message: "ค้นหารายการจองไม่สำเร็จ",
          error: found.error.message || "Supabase error",
        },
        { status: 500 }
      );
    }

    if (!found.data) {
      return Response.json(
        {
          message: "ไม่พบรายการจอง",
          error: "BOOKING_NOT_FOUND",
          bookingId,
        },
        { status: 404 }
      );
    }

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

    if (!action || Object.keys(updateData).length === 1) {
      return Response.json(
        {
          message: "Missing action",
          error: "MISSING_ACTION",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", found.data.id)
      .select("*")
      .single();

    if (error) {
      return Response.json(
        {
          message: "อัปเดตรายการไม่สำเร็จ",
          error: error.message || "Supabase error",
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "อัปเดตรายการสำเร็จ",
      booking: data,
    });
  } catch (error) {
    console.error("ADMIN_PATCH_BOOKINGS_ERROR", error);

    return Response.json(
      {
        message: "อัปเดตรายการไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
