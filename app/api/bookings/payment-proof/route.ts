import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PaymentProofPayload = {
  bookingId?: string;
  paymentReference?: string;
  transferReference: string;
  slipFileName: string;
  slipUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PaymentProofPayload;

    if (!body.bookingId && !body.paymentReference) {
      return NextResponse.json(
        {
          ok: false,
          message: "bookingId or paymentReference is required",
        },
        { status: 400 }
      );
    }

    if (!body.transferReference || !body.slipFileName) {
      return NextResponse.json(
        {
          ok: false,
          message: "transferReference and slipFileName are required",
        },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
      where: body.bookingId
        ? {
            id: body.bookingId,
          }
        : {
            paymentReference: body.paymentReference,
          },
      data: {
        transferReference: body.transferReference,
        slipFileName: body.slipFileName,
        slipUrl: body.slipUrl || "",
        paymentStatus: "WAITING_VERIFY",
        status: "PENDING",
      },
      include: {
        items: true,
        guests: true,
      },
    });

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error("Payment proof error:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Cannot submit payment proof",
      },
      { status: 500 }
    );
  }
}