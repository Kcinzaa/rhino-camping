import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const username = String(body.username || "");
    const password = String(body.password || "");

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "123456";
    const adminToken = process.env.ADMIN_LOCAL_TOKEN || "admin-local-session";

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        {
          message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    const response = NextResponse.json({
      message: "Login success",
      token: adminToken,
    });

    response.cookies.set("adminToken", adminToken, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("ADMIN_LOGIN_ERROR", error);

    return NextResponse.json(
      {
        message: "Login failed",
      },
      {
        status: 500,
      }
    );
  }
}