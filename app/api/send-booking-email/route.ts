import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type BookingEmailPayload = {
  to: string;
  customerName: string;
  bookingCode: string;
  paymentReference: string;
  pinCode?: string;
  expireText: string;
  amount: number;
  groupBenefitTitle?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingEmailPayload;

    if (!body.to) {
      return NextResponse.json(
        { message: "Missing recipient email" },
        { status: 400 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return NextResponse.json(
        { message: "SMTP configuration is missing" },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const customerName = escapeHtml(body.customerName || "-");
    const bookingCode = escapeHtml(body.bookingCode || "-");
    const paymentReference = escapeHtml(body.paymentReference || "-");
    const pinCode = escapeHtml(body.pinCode || "-");
    const expireText = escapeHtml(body.expireText || "-");
    const groupBenefitTitle = body.groupBenefitTitle
      ? escapeHtml(body.groupBenefitTitle)
      : "";

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f7f1e7; padding:24px;">
        <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #e5e7eb;">
          <div style="background:#101010; color:#ffffff; padding:24px;">
            <p style="margin:0 0 8px; color:#fb923c; font-size:12px; font-weight:700; letter-spacing:2px;">RHINO CAMPING</p>
            <h1 style="margin:0; font-size:28px;">รายละเอียดการจองของคุณ</h1>
            <p style="margin:8px 0 0; color:#fed7aa;">กรุณาชำระเงินภายในเวลาที่กำหนดเพื่อยืนยันการล็อกห้อง</p>
          </div>

          <div style="padding:24px;">
            <p style="font-size:18px; margin:0 0 16px;">
              สวัสดีคุณ <strong>${customerName}</strong>
            </p>

            <p style="line-height:1.7; color:#374151;">
              ระบบได้รับรายการจองแล้ว กรุณาโอนเงินตามยอดและอัปโหลดสลิปในหน้า Manage
              หลังจากทีมงานตรวจสอบแล้ว สถานะการจองจะเปลี่ยนเป็นยืนยันแล้ว
            </p>

            <table style="width:100%; border-collapse:collapse; margin-top:24px;">
              <tr>
                <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">หมายเลขการจอง</td>
                <td style="padding:14px; border:1px solid #e5e7eb;"><strong>${bookingCode}</strong></td>
              </tr>
              <tr>
                <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">เลขอ้างอิงชำระเงิน</td>
                <td style="padding:14px; border:1px solid #e5e7eb; color:#111827; font-size:22px;"><strong>${paymentReference}</strong></td>
              </tr>
              <tr>
                <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">รหัส PIN</td>
                <td style="padding:14px; border:1px solid #e5e7eb; color:#b91c1c; font-size:22px;"><strong>${pinCode}</strong></td>
              </tr>
              <tr>
                <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">ระยะเวลาล็อกห้อง</td>
                <td style="padding:14px; border:1px solid #e5e7eb; color:#15803d;"><strong>${expireText}</strong></td>
              </tr>
              <tr>
                <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">ยอดชำระ</td>
                <td style="padding:14px; border:1px solid #e5e7eb; color:#b91c1c; font-size:22px;"><strong>฿${Number(body.amount || 0).toLocaleString()}</strong></td>
              </tr>
              ${
                groupBenefitTitle
                  ? `<tr>
                      <td style="padding:14px; border:1px solid #e5e7eb; background:#f9fafb;">สิทธิ์พิเศษ</td>
                      <td style="padding:14px; border:1px solid #e5e7eb; color:#15803d;"><strong>${groupBenefitTitle}</strong></td>
                    </tr>`
                  : ""
              }
            </table>

            <div style="margin-top:24px; padding:16px; background:#fff7ed; border:1px solid #fed7aa; border-radius:16px; color:#7c2d12; line-height:1.7;">
              รายการนี้ยังไม่ใช่การยืนยันการจองจนกว่าทีมงานจะตรวจสอบสลิปและยืนยันสถานะในระบบ
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to: body.to,
      subject: `รายละเอียดการจอง Rhino Camping ${paymentReference}`,
      html,
    });

    return NextResponse.json({
      ok: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("SEND_BOOKING_EMAIL_ERROR", error);

    return NextResponse.json(
      { message: "Failed to send email" },
      { status: 500 }
    );
  }
}
