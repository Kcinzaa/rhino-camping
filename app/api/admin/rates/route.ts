import {
  adminUnauthorized,
  isAdminRequest,
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { data: rates, error: rateError } = await supabaseAdmin
      .from("room_rates")
      .select("*")
      .order("created_at", { ascending: true });

    if (rateError) {
      return Response.json(
        {
          message: "โหลดข้อมูลราคาไม่สำเร็จ",
          error: rateError.message,
        },
        { status: 500 }
      );
    }

    const { data: rooms, error: roomError } = await supabaseAdmin
      .from("room_types")
      .select("id, name, category, capacity, unit_label")
      .order("created_at", { ascending: true });

    if (roomError) {
      return Response.json(
        {
          message: "โหลดข้อมูลประเภทห้องไม่สำเร็จ",
          error: roomError.message,
        },
        { status: 500 }
      );
    }

    const roomMap = new Map((rooms || []).map((room) => [room.id, room]));

    const mappedRates = (rates || []).map((rate) => ({
      ...rate,
      room_type: roomMap.get(rate.room_type_id) || null,
    }));

    return Response.json({
      rates: mappedRates,
      rooms: rooms || [],
    });
  } catch (error) {
    console.error("ADMIN_GET_RATES_ERROR", error);

    return Response.json(
      {
        message: "โหลดข้อมูลราคาไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const body = await request.json();

    const roomTypeId = String(body.room_type_id || "");
    const dayType = String(body.day_type || "WEEKDAY");
    const price = Number(body.price_per_person || 0);

    if (!roomTypeId) {
      return Response.json(
        { message: "กรุณาเลือกประเภทห้อง" },
        { status: 400 }
      );
    }

    if (!price || price < 0) {
      return Response.json(
        { message: "กรุณากรอกราคาให้ถูกต้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("room_rates")
      .insert({
        room_type_id: roomTypeId,
        day_type: dayType,
        price_per_person: price,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return Response.json(
        {
          message: "เพิ่มราคาไม่สำเร็จ",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "เพิ่มราคาสำเร็จ",
      rate: data,
    });
  } catch (error) {
    console.error("ADMIN_CREATE_RATE_ERROR", error);

    return Response.json(
      {
        message: "เพิ่มราคาไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const body = await request.json();

    const id = String(body.id || "");
    const price = Number(body.price_per_person || 0);

    if (!id) {
      return Response.json({ message: "Missing rate id" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("room_rates")
      .update({
        price_per_person: price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return Response.json(
        {
          message: "อัปเดตราคาไม่สำเร็จ",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "อัปเดตราคาสำเร็จ",
      rate: data,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_RATE_ERROR", error);

    return Response.json(
      {
        message: "อัปเดตราคาไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}