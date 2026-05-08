import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function isAdminRequest(request: Request) {
  const token = process.env.ADMIN_LOCAL_TOKEN || "admin-local-session";

  const authHeader = request.headers.get("authorization") || "";
  const cookieHeader = request.headers.get("cookie") || "";

  const hasBearer = authHeader === `Bearer ${token}`;
  const hasCookie = cookieHeader.includes(`adminToken=${token}`);

  return hasBearer || hasCookie;
}

export function adminUnauthorized() {
  return Response.json(
    {
      message: "Unauthorized",
      error: "ADMIN_AUTH_REQUIRED",
    },
    {
      status: 401,
    }
  );
}