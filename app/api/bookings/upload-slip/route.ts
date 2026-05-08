import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET_NAME = "payment-slips";

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "jpg" : "jpg";
}

function isAllowedImage(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  return allowedTypes.includes(file.type);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("slip") as File | null;
    const paymentReference = String(formData.get("paymentReference") || "");
    const lineUserId = String(formData.get("lineUserId") || "");

    if (!file) {
      return NextResponse.json(
        { message: "Missing slip file" },
        { status: 400 }
      );
    }

    if (!paymentReference) {
      return NextResponse.json(
        { message: "Missing paymentReference" },
        { status: 400 }
      );
    }

    if (!lineUserId) {
      return NextResponse.json(
        { message: "Missing lineUserId" },
        { status: 400 }
      );
    }

    if (!isAllowedImage(file)) {
      return NextResponse.json(
        { message: "รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB" },
        { status: 400 }
      );
    }

    const extension = getFileExtension(file.name);
    const safePaymentReference = paymentReference.replace(/[^a-zA-Z0-9_-]/g, "");
    const filePath = `${lineUserId}/${safePaymentReference}-${Date.now()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("UPLOAD_SLIP_STORAGE_ERROR", uploadError);

      return NextResponse.json(
        {
          message: "Upload slip failed",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const slipUrl = publicUrlData.publicUrl;

    const { data: booking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_slip_url: slipUrl,
        payment_slip_path: filePath,
        payment_status: "WAITING_VERIFY",
        booking_status: "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("payment_reference", paymentReference)
      .eq("line_user_id", lineUserId)
      .select("*")
      .single();

    if (updateError) {
      console.error("UPDATE_BOOKING_SLIP_ERROR", updateError);

      return NextResponse.json(
        {
          message: "Update booking slip failed",
          error: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Upload slip success",
      slipUrl,
      slipPath: filePath,
      booking,
    });
  } catch (error) {
    console.error("UPLOAD_SLIP_API_ERROR", error);

    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}