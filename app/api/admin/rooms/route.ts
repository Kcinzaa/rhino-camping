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

type AdminRoomUnit = {
  id: string;
  name: string;
  status: string;
};

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const { data, error } = await supabaseAdmin
      .from("room_types")
      .select("*, room_units ( id, name, status )")
      .eq("sell_on_rhino", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("ADMIN_GET_ROOMS_SUPABASE_ERROR", error);

      return Response.json(
        {
          message: "โหลดข้อมูลห้องไม่สำเร็จ",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const rooms = ((data || []) as any[]).filter(isRhinoRoom).map((room) => {
      const units = (Array.isArray(room.room_units) ? room.room_units : []) as AdminRoomUnit[];
      const availableUnits = units.filter((unit) => unit.status === "AVAILABLE").length;
      const lockedUnits = units.filter((unit) => unit.status === "LOCKED").length;
      const maintenanceUnits = units.filter((unit) => {
        return unit.status === "MAINTENANCE" || unit.status === "DISABLED";
      }).length;

      return {
        ...room,
        total_units: units.length,
        available_rooms: availableUnits,
        locked_rooms: lockedUnits,
        maintenance_rooms: maintenanceUnits,
      };
    });

    return Response.json({ rooms });
  } catch (error) {
    console.error("ADMIN_GET_ROOMS_ERROR", error);

    return Response.json(
      {
        message: "โหลดข้อมูลห้องไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorized();

  try {
    const body = await request.json();

    const payload = {
      name: String(body.name || "").trim(),
      slug: String(body.slug || "").trim(),
      category: String(body.category || "TENT"),
      capacity: Number(body.capacity || 1),
      unit_label: String(body.unit_label || "หลัง"),
      description: String(body.description || ""),
      cover_image: String(body.cover_image || ""),
      gallery_images: Array.isArray(body.gallery_images)
        ? body.gallery_images
        : [],
      is_pet_allowed: Boolean(body.is_pet_allowed),
      is_active: body.is_active !== false,
      sell_on_rhino: true,
      sell_on_gorilla: Boolean(body.sell_on_gorilla),
      updated_at: new Date().toISOString(),
    };

    if (!payload.name) {
      return Response.json(
        {
          message: "กรุณากรอกชื่อห้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.slug) {
      payload.slug = payload.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\wก-๙-]/g, "");
    }

    const { data, error } = await supabaseAdmin
      .from("room_types")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN_CREATE_ROOM_SUPABASE_ERROR", error);

      return Response.json(
        {
          message: "เพิ่มประเภทห้องไม่สำเร็จ",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      message: "เพิ่มประเภทห้องสำเร็จ",
      room: data,
    });
  } catch (error) {
    console.error("ADMIN_CREATE_ROOM_ERROR", error);

    return Response.json(
      {
        message: "เพิ่มประเภทห้องไม่สำเร็จ",
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
    const body = await request.json();

    const id = String(body.id || "");

    if (!id) {
      return Response.json(
        {
          message: "Missing room id",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      name: String(body.name || "").trim(),
      slug: String(body.slug || "").trim(),
      category: String(body.category || "TENT"),
      capacity: Number(body.capacity || 1),
      unit_label: String(body.unit_label || "หลัง"),
      description: String(body.description || ""),
      cover_image: String(body.cover_image || ""),
      gallery_images: Array.isArray(body.gallery_images)
        ? body.gallery_images
        : [],
      is_pet_allowed: Boolean(body.is_pet_allowed),
      is_active: body.is_active !== false,
      sell_on_rhino: body.sell_on_rhino !== false,
      sell_on_gorilla: Boolean(body.sell_on_gorilla),
      updated_at: new Date().toISOString(),
    };

    if (!payload.name) {
      return Response.json(
        {
          message: "กรุณากรอกชื่อห้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.slug) {
      payload.slug = payload.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\wก-๙-]/g, "");
    }

    const { data, error } = await supabaseAdmin
      .from("room_types")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN_UPDATE_ROOM_SUPABASE_ERROR", error);

      return Response.json(
        {
          message: "อัปเดตประเภทห้องไม่สำเร็จ",
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      message: "อัปเดตประเภทห้องสำเร็จ",
      room: data,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_ROOM_ERROR", error);

    return Response.json(
      {
        message: "อัปเดตประเภทห้องไม่สำเร็จ",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
