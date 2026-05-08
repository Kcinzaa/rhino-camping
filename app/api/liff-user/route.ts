import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LiffUserPayload = {
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LiffUserPayload;

    const lineUserId =
      body.lineUserId || process.env.NEXT_PUBLIC_DEV_LINE_USER_ID || "dev-line-user-001";

    const displayName = body.displayName || "ผู้ใช้ LINE";
    const pictureUrl = body.pictureUrl || "";

    const user = await prisma.user.upsert({
      where: {
        lineUserId,
      },
      update: {
        displayName,
        pictureUrl,
      },
      create: {
        lineUserId,
        displayName,
        pictureUrl,
        role: "USER",
      },
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("LIFF user API error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Cannot save LIFF user",
      },
      { status: 500 }
    );
  }
}