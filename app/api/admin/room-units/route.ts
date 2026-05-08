import {
  adminUnauthorized,
  isAdminRequest,
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

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
    const { data: units, error: unitError } = await supabaseAdmin
      .from("room_units")
      .select("*")
      .order("created_at", { ascending: true });

    if (unitError) {
      return Response.json(
        {
          message: "โหลดข้อมูลยูนิตห้องไม่สำเร็จ",
          error: unitError.message,
        },
        { status: 500 }
      );
    }

    const { data: rooms, error: roomError } = await supabaseAdmin
      .from("room_types")
      .select("id, name, slug, category, capacity, unit_label, is_active, sell_on_rhino")
      .eq("sell_on_rhino", true)
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

    const rhinoRooms = (rooms || []).filter(isRhinoRoom);
    const roomIds = new Set(rhinoRooms.map((room) => room.id));
    const roomMap = new Map(rhinoRooms.map((room) => [room.id, room]));

    const roomUnits = (units || [])
      .filter((unit) => roomIds.has(unit.room_type_id))
      .map((unit) => ({
        ...unit,
        room_type: roomMap.get(unit.room_type_id) || null,
      }));

    return Response.json({
      roomUnits,
      rooms: rhinoRooms,
    });
  } catch (error) {
    console.error("ADMIN_GET_ROOM_UNITS_ERROR", error);

    return Response.json(
      {
        message: "โหลดข้อมูลยูนิตห้องไม่สำเร็จ",
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
    const name = String(body.name || "").trim();
    const status = String(body.status || "AVAILABLE");

    if (!roomTypeId) {
      return Response.json(
        { message: "กรุณาเลือกประเภทห้อง" },
        { status: 400 }
      );
    }

    if (!name) {
      return Response.json(
        { message: "กรุณากรอกชื่อยูนิตห้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("room_units")
      .insert({
        room_type_id: roomTypeId,
        name,
        status,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return Response.json(
        {
          message: "เพิ่มยูนิตห้องไม่สำเร็จ",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "เพิ่มยูนิตห้องสำเร็จ",
      roomUnit: data,
    });
  } catch (error) {
    console.error("ADMIN_CREATE_ROOM_UNIT_ERROR", error);

    return Response.json(
      {
        message: "เพิ่มยูนิตห้องไม่สำเร็จ",
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
    const name = String(body.name || "").trim();
    const status = String(body.status || "AVAILABLE");

    if (!id) {
      return Response.json({ message: "Missing unit id" }, { status: 400 });
    }

    if (!name) {
      return Response.json(
        { message: "กรุณากรอกชื่อยูนิตห้อง" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("room_units")
      .update({
        name,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return Response.json(
        {
          message: "อัปเดตยูนิตห้องไม่สำเร็จ",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return Response.json({
      message: "อัปเดตยูนิตห้องสำเร็จ",
      roomUnit: data,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_ROOM_UNIT_ERROR", error);

    return Response.json(
      {
        message: "อัปเดตยูนิตห้องไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
