import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type BookingCartItem = {
  cartId: string;
  roomTypeId?: string;
  roomName: string;
  roomSlug?: string;
  quantity: number;
  adults: number;
  children: number;
  totalGuests: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  totalAmount?: number;
  coverImage?: string;
};

type GroupBenefit = {
  level: "NONE" | "KARAOKE" | "PARTY";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  assigned: boolean;
  capacity: number;
  remaining: number;
};

type ExistingBookingRow = {
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    groupBenefit?: Partial<GroupBenefit> | null;
  } | null;
};

type BookingGuest = {
  roomCartId: string;
  guestName: string;
  useBookerInfo?: boolean;
  nationality?: string;
  arrivalTime?: string;
  note?: string;
};

type CreateBookingPayload = {
  bookingCode: string;
  lineUserId: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    contact?: string;
  };
  guests: BookingGuest[];
  payment: {
    method: string;
    reference?: string;
    slipFileName?: string;
    paymentReference: string;
    expireAt: string;
    status: string;
  };
  cart: {
    checkIn?: string;
    checkOut?: string;
    nights: number;
    items: BookingCartItem[];
    total: number;
    savedAt?: string;
  };
  finalAmount: number;
  createdAt?: string;
  status: string;
};

const PROMO_LIMIT = {
  KARAOKE: 2,
  PARTY: 2,
} as const;

function getTotalRooms(items: BookingCartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function getTotalGuests(items: BookingCartItem[]) {
  return items.reduce((sum, item) => sum + Number(item.totalGuests || 0), 0);
}

function getTotalAdults(items: BookingCartItem[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item.adults || 0) * Number(item.quantity || 1);
  }, 0);
}

function getTotalChildren(items: BookingCartItem[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item.children || 0) * Number(item.quantity || 1);
  }, 0);
}

function normalizeDate(value?: string) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return value;
}

function isActiveBooking(booking: ExistingBookingRow) {
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

function isDateOverlap(
  booking: ExistingBookingRow,
  checkIn: string,
  checkOut: string
) {
  const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
  const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;

  return Boolean(
    bookingCheckIn &&
      bookingCheckOut &&
      bookingCheckIn < checkOut &&
      bookingCheckOut > checkIn
  );
}

function createGroupBenefit(
  level: GroupBenefit["level"],
  remaining: number
): GroupBenefit {
  if (level === "PARTY") {
    return {
      level,
      title: "ได้สิทธิ์ห้องปาร์ตี้ส่วนตัว",
      subtitle:
        remaining > 0
          ? `เหลือ ${remaining} จาก 2 ห้องในช่วงวันที่เลือก`
          : "ห้องปาร์ตี้เต็มแล้วในช่วงวันที่เลือก",
      description:
        "สำหรับกลุ่ม 10 คนขึ้นไป ระบบล็อกสิทธิ์ห้องปาร์ตี้ให้ตามจำนวนห้องที่เหลือจริง",
      badge: remaining > 0 ? "ฟรีห้องปาร์ตี้" : "สิทธิ์เต็มแล้ว",
      assigned: remaining > 0,
      capacity: PROMO_LIMIT.PARTY,
      remaining,
    };
  }

  if (level === "KARAOKE") {
    return {
      level,
      title: "ได้สิทธิ์ห้องคาราโอเกะส่วนตัว",
      subtitle:
        remaining > 0
          ? `เหลือ ${remaining} จาก 2 ห้องในช่วงวันที่เลือก`
          : "ห้องคาราโอเกะเต็มแล้วในช่วงวันที่เลือก",
      description:
        "สำหรับกลุ่ม 6 คนขึ้นไป ระบบล็อกสิทธิ์ห้องคาราโอเกะให้ตามจำนวนห้องที่เหลือจริง",
      badge: remaining > 0 ? "ฟรีคาราโอเกะ" : "สิทธิ์เต็มแล้ว",
      assigned: remaining > 0,
      capacity: PROMO_LIMIT.KARAOKE,
      remaining,
    };
  }

  return {
    level: "NONE",
    title: "ยังไม่ถึงโปรกลุ่ม",
    subtitle: "ครบ 6 คนรับสิทธิ์ห้องคาราโอเกะ / ครบ 10 คนรับสิทธิ์ห้องปาร์ตี้",
    description: "ระบบจะเช็กจำนวนห้องสิทธิ์พิเศษอีกครั้งตอนบันทึกการจอง",
    badge: "ยังไม่ได้โปร",
    assigned: false,
    capacity: 0,
    remaining: 0,
  };
}

function getRequestedBenefitLevel(adults: number): GroupBenefit["level"] {
  if (adults >= 10) return "PARTY";
  if (adults >= 6) return "KARAOKE";
  return "NONE";
}

async function assignGroupBenefit({
  adults,
  checkIn,
  checkOut,
}: {
  adults: number;
  checkIn: string | null;
  checkOut: string | null;
}) {
  const requestedLevel = getRequestedBenefitLevel(adults);

  if (requestedLevel === "NONE" || !checkIn || !checkOut) {
    return createGroupBenefit("NONE", 0);
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("check_in, check_out, booking_status, payment_status, cart_data")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (error) {
    console.error("ASSIGN_GROUP_BENEFIT_ERROR", error);
    return createGroupBenefit(requestedLevel, 0);
  }

  const used = ((data || []) as ExistingBookingRow[]).filter((booking) => {
    return (
      isActiveBooking(booking) &&
      isDateOverlap(booking, checkIn, checkOut) &&
      booking.cart_data?.groupBenefit?.level === requestedLevel &&
      booking.cart_data?.groupBenefit?.assigned !== false
    );
  }).length;

  const limit =
    requestedLevel === "PARTY" ? PROMO_LIMIT.PARTY : PROMO_LIMIT.KARAOKE;
  const remaining = Math.max(limit - used, 0);

  return createGroupBenefit(requestedLevel, remaining);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingPayload;

    if (!body.bookingCode) {
      return NextResponse.json(
        { message: "Missing bookingCode" },
        { status: 400 }
      );
    }

    if (!body.lineUserId) {
      return NextResponse.json(
        { message: "Missing lineUserId" },
        { status: 400 }
      );
    }

    if (!body.payment?.paymentReference) {
      return NextResponse.json(
        { message: "Missing paymentReference" },
        { status: 400 }
      );
    }

    if (!body.customer?.email?.trim()) {
      return NextResponse.json(
        { message: "Missing customer email" },
        { status: 400 }
      );
    }

    if (!body.cart?.items?.length) {
      return NextResponse.json(
        { message: "Missing cart items" },
        { status: 400 }
      );
    }

    const totalRooms = getTotalRooms(body.cart.items);
    const totalGuests = getTotalGuests(body.cart.items);
    const totalAdults = getTotalAdults(body.cart.items);
    const totalChildren = getTotalChildren(body.cart.items);
    const checkIn = normalizeDate(body.cart.checkIn);
    const checkOut = normalizeDate(body.cart.checkOut);

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { message: "Missing check-in or check-out date" },
        { status: 400 }
      );
    }

    const groupBenefit = await assignGroupBenefit({
      adults: totalAdults,
      checkIn,
      checkOut,
    });
    const cartData = {
      ...body.cart,
      groupBenefit,
    };

    const payload = {
      booking_no: body.bookingCode,
      payment_reference: body.payment.paymentReference,
      line_user_id: body.lineUserId,

      customer_name: body.customer.name,
      customer_phone: body.customer.phone,
      customer_email: body.customer.email || null,
      customer_contact: body.customer.contact || null,

      check_in: checkIn,
      check_out: checkOut,
      nights: Number(body.cart.nights || 1),
      total_rooms: totalRooms,
      total_guests: totalGuests,
      total_amount: Number(body.finalAmount || body.cart.total || 0),
      total_adults: totalAdults,
      total_children: totalChildren,

      payment_status: body.payment.status || "WAITING_PAYMENT",
      booking_status: body.status || "PENDING_PAYMENT",
      payment_slip_url: null,
      expire_at: body.payment.expireAt,

      cart_data: cartData,
      guest_data: body.guests || [],
      created_at: body.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("CREATE_BOOKING_SUPABASE_ERROR", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload,
      });

      return NextResponse.json(
        {
          message: "Create booking failed",
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Create booking success",
      booking: data,
    });
  } catch (error) {
    console.error("CREATE_BOOKING_API_ERROR", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId");

    if (!lineUserId) {
      return NextResponse.json(
        { message: "Missing lineUserId" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("line_user_id", lineUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET_BOOKINGS_SUPABASE_ERROR", error);

      return NextResponse.json(
        {
          message: "Get bookings failed",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: data || [],
    });
  } catch (error) {
    console.error("GET_BOOKINGS_API_ERROR", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
