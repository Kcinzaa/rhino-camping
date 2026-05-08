"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Eye,
  FileImage,
  Loader2,
  Mail,
  Phone,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  ShieldX,
  UserRound,
  UsersRound,
  WalletCards,
  XCircle,
} from "lucide-react";

type BookingCartItem = {
  cartId?: string;
  roomTypeId?: string;
  roomName?: string;
  quantity?: number;
  adults?: number;
  children?: number;
  totalGuests?: number;
  totalAmount?: number;
  coverImage?: string;
  image?: string;
  checkIn?: string;
  checkOut?: string;
};

type GuestData = {
  roomCartId?: string;
  guestName?: string;
  useBookerInfo?: boolean;
  nationality?: string;
  arrivalTime?: string;
  note?: string;
  totalGuests?: number;
};

type GroupBenefit = {
  level?: "NONE" | "KARAOKE" | "PARTY";
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
};

type BookingRow = {
  id: string;
  booking_no?: string;
  payment_reference?: string;
  line_user_id?: string;

  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_contact?: string;

  check_in?: string;
  check_out?: string;
  nights?: number;
  total_rooms?: number;
  total_guests?: number;
  total_amount?: number;

  payment_status?: string;
  booking_status?: string;
  payment_slip_url?: string | null;
  payment_slip_path?: string | null;
  expire_at?: string | null;

  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    items?: BookingCartItem[];
    total?: number;
    savedAt?: string;
  } | null;

  guest_data?: GuestData[] | null;

  summary_data?: {
    totalRooms?: number;
    totalAdults?: number;
    totalChildren?: number;
    totalGuests?: number;
    groupBenefit?: GroupBenefit;
  } | null;

  group_benefit?: GroupBenefit | null;

  created_at?: string;
  updated_at?: string;
};

type ApiBookingResponse = {
  booking?: BookingRow;
  message?: string;
  error?: string;
};

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  orangeSoft: "#fff7ed",
  line: "#e8ddd0",
  muted: "#64748b",
  green: "#16a34a",
  greenSoft: "#ecfdf5",
  red: "#dc2626",
  redSoft: "#fff1f2",
  blueSoft: "#f8fafc",
  yellowSoft: "#fffbeb",
};

export default function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAction, setUpdatingAction] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [autoCancelling, setAutoCancelling] = useState(false);

  useEffect(() => {
    async function resolveParams() {
      const resolved = await params;
      setBookingId(resolved.bookingId);
    }

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;
    loadBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!booking) return;
    if (autoCancelling) return;

    const expired = isBookingExpiredWithoutSlip(booking, now);

    if (!expired) return;

    if (
      booking.booking_status === "CANCELLED" ||
      booking.payment_status === "CANCELLED"
    ) {
      return;
    }

    autoCancelExpiredBooking(booking.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, now, autoCancelling]);

  function getToken() {
    if (typeof window === "undefined") return "admin-local-session";
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadBooking() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/bookings?bookingId=${encodeURIComponent(bookingId)}`,
        {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiBookingResponse;

      if (!response.ok) {
        alert(result.message || result.error || "โหลดรายละเอียดการจองไม่สำเร็จ");
        return;
      }

      setBooking(result.booking || null);
    } catch (error) {
      console.error("ADMIN_LOAD_BOOKING_DETAIL_ERROR", error);
      alert("โหลดรายละเอียดการจองไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function autoCancelExpiredBooking(id: string) {
    setAutoCancelling(true);

    try {
      const response = await fetch(
        `/api/admin/bookings?bookingId=${encodeURIComponent(id)}`,
        {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          action: "CANCEL_BOOKING",
          reason: "AUTO_CANCEL_EXPIRED_PAYMENT",
        }),
        }
      );

      const result = (await response.json()) as ApiBookingResponse;

      if (response.ok && result.booking) {
        setBooking(result.booking);
        return;
      }

      setBooking((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          booking_status: "CANCELLED",
          payment_status: "CANCELLED",
          updated_at: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error("AUTO_CANCEL_EXPIRED_BOOKING_ERROR", error);

      setBooking((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          booking_status: "CANCELLED",
          payment_status: "CANCELLED",
          updated_at: new Date().toISOString(),
        };
      });
    } finally {
      setAutoCancelling(false);
    }
  }

  async function updateBookingStatus(
    action: "CONFIRM_PAYMENT" | "REJECT_PAYMENT" | "CANCEL_BOOKING"
  ) {
    if (!booking) return;

    const expired = isBookingExpiredWithoutSlip(booking, now);

    if (expired && action !== "CANCEL_BOOKING") {
      alert("รายการนี้หมดเวลาชำระเงินแล้ว ไม่สามารถยืนยันสลิปได้");
      return;
    }

    const confirmMessage =
      action === "CONFIRM_PAYMENT"
        ? "ยืนยันสลิปและยืนยันห้องพักรายการนี้?"
        : action === "REJECT_PAYMENT"
        ? "ปฏิเสธสลิปนี้ และให้ลูกค้าอัปโหลดใหม่?"
        : "ยกเลิกการจองนี้?";

    if (!confirm(confirmMessage)) return;

    setUpdatingAction(action);

    try {
      const response = await fetch(
        `/api/admin/bookings?bookingId=${encodeURIComponent(booking.id)}`,
        {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          action,
        }),
        }
      );

      const result = (await response.json()) as ApiBookingResponse;

      if (!response.ok) {
        alert(result.message || result.error || "อัปเดตรายการไม่สำเร็จ");
        return;
      }

      setBooking(result.booking || null);
      alert("อัปเดตรายการสำเร็จ");
    } catch (error) {
      console.error("ADMIN_UPDATE_BOOKING_ERROR", error);
      alert("อัปเดตรายการไม่สำเร็จ");
    } finally {
      setUpdatingAction("");
    }
  }

  async function copyReference() {
    if (!booking) return;

    const ref = booking.payment_reference || booking.booking_no || booking.id;

    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  }

  const effectiveBooking = useMemo(() => {
    if (!booking) return null;

    const expired = isBookingExpiredWithoutSlip(booking, now);

    if (
      expired &&
      booking.booking_status !== "CANCELLED" &&
      booking.payment_status !== "CANCELLED"
    ) {
      return {
        ...booking,
        booking_status: "CANCELLED",
        payment_status: "CANCELLED",
      };
    }

    return booking;
  }, [booking, now]);

  const summary = useMemo(() => {
    if (!effectiveBooking) {
      return {
        totalRooms: 0,
        totalAdults: 0,
        totalChildren: 0,
        totalGuests: 0,
      };
    }

    return getBookingSummary(effectiveBooking);
  }, [effectiveBooking]);

  const mainGuest = useMemo(() => {
    if (!effectiveBooking?.guest_data?.length) return null;

    return (
      effectiveBooking.guest_data.find(
        (guest) => guest.roomCartId === "ALL_ROOMS"
      ) || effectiveBooking.guest_data[0]
    );
  }, [effectiveBooking]);

  const groupBenefit = useMemo(() => {
    if (!effectiveBooking) return getGroupBenefit(0);

    return (
      effectiveBooking.summary_data?.groupBenefit ||
      effectiveBooking.group_benefit ||
      getGroupBenefit(summary.totalAdults)
    );
  }, [effectiveBooking, summary.totalAdults]);

  if (loading) {
    return (
      <main className="grid gap-7">
        <section
          className="rounded-[34px] border p-10 text-center"
          style={{
            background: UI.paper,
            borderColor: UI.line,
          }}
        >
          <Loader2 className="mx-auto animate-spin" size={48} color={UI.orange} />
          <h1 className="mt-4 text-2xl font-black">กำลังโหลดรายละเอียดการจอง</h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            กรุณารอสักครู่
          </p>
        </section>
      </main>
    );
  }

  if (!effectiveBooking) {
    return (
      <main className="grid gap-7">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            color: UI.black,
          }}
        >
          <ArrowLeft size={18} />
          กลับหน้ารายการจอง
        </Link>

        <section
          className="rounded-[34px] border p-10 text-center"
          style={{
            background: UI.paper,
            borderColor: UI.line,
          }}
        >
          <AlertTriangle className="mx-auto" size={54} color={UI.orange} />
          <h1 className="mt-4 text-3xl font-black">ไม่พบรายการจอง</h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            รายการนี้อาจถูกลบ หรือ bookingId ไม่ถูกต้อง
          </p>
        </section>
      </main>
    );
  }

  const statusText = getStatusText(
    effectiveBooking.booking_status || "",
    effectiveBooking.payment_status || ""
  );

  const statusStyle = getStatusStyle(
    effectiveBooking.booking_status || "",
    effectiveBooking.payment_status || ""
  );

  const ref =
    effectiveBooking.payment_reference ||
    effectiveBooking.booking_no ||
    effectiveBooking.id;

  const totalAmount = Number(
    effectiveBooking.total_amount || effectiveBooking.cart_data?.total || 0
  );

  const expired = isBookingExpiredWithoutSlip(effectiveBooking, now);
  const isCancelled =
    effectiveBooking.booking_status === "CANCELLED" ||
    effectiveBooking.payment_status === "CANCELLED";

  const hasSlip = Boolean(
    effectiveBooking.payment_slip_url || effectiveBooking.payment_slip_path
  );

  const remainMs = Math.max(getBookingExpireTime(effectiveBooking) - now, 0);
  const remainText = formatCountdown(remainMs);

  const canConfirm =
    effectiveBooking.payment_status === "WAITING_VERIFY" &&
    hasSlip &&
    !isCancelled &&
    !expired;

  const canReject =
    effectiveBooking.payment_status === "WAITING_VERIFY" &&
    hasSlip &&
    !isCancelled;

  const canCancel =
    !isCancelled &&
    effectiveBooking.booking_status !== "CONFIRMED" &&
    effectiveBooking.payment_status !== "PAID";

  return (
    <main className="grid gap-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition hover:-translate-x-1"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            color: UI.black,
          }}
        >
          <ArrowLeft size={18} />
          กลับหน้ารายการจอง
        </Link>

        <button
          type="button"
          onClick={loadBooking}
          className="inline-flex w-fit min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            color: UI.black,
          }}
        >
          <RefreshCcw size={18} />
          รีเฟรช
        </button>
      </div>

      <section
        className="overflow-hidden rounded-[42px] border shadow-sm"
        style={{
          background: UI.paper,
          borderColor: UI.line,
          boxShadow: "0 22px 70px rgba(15,23,42,0.08)",
        }}
      >
        <div
          className="relative overflow-hidden p-7 md:p-9"
          style={{
            background:
              "linear-gradient(135deg, #101010 0%, #181818 56%, #321807 100%)",
            color: "#ffffff",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ background: UI.orange }}
          />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
                style={{
                  background: "rgba(249,115,22,0.13)",
                  color: UI.orange,
                  border: "1px solid rgba(249,115,22,0.35)",
                }}
              >
                <ReceiptText size={16} />
                Booking Detail
              </div>

              <h1 className="mt-5 text-4xl font-black md:text-5xl">
                รายละเอียดการจอง
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                  }}
                >
                  {statusStyle.icon}
                  {statusText}
                </span>

                {hasSlip && !isCancelled && (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black"
                    style={{
                      background: UI.greenSoft,
                      color: UI.green,
                    }}
                  >
                    <ShieldCheck size={16} />
                    มีสลิปแล้ว
                  </span>
                )}

                {expired && (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black"
                    style={{
                      background: UI.redSoft,
                      color: UI.red,
                    }}
                  >
                    <AlertTriangle size={16} />
                    เกินเวลาชำระเงิน
                  </span>
                )}
              </div>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/60">
                เลขอ้างอิง:{" "}
                <span className="font-black text-white">{ref}</span>
              </p>

              {!isCancelled &&
                effectiveBooking.payment_status === "WAITING_PAYMENT" && (
                  <p className="mt-2 text-sm font-black" style={{ color: UI.orange }}>
                    เหลือเวลาชำระเงิน {remainText}
                  </p>
                )}
            </div>

            <div className="rounded-[32px] bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-black text-white/55">ยอดชำระรวม</p>
              <p className="mt-2 text-5xl font-black" style={{ color: UI.orange }}>
                ฿{totalAmount.toLocaleString()}
              </p>
              <p className="mt-2 text-xs font-semibold text-white/45">
                สถานะชำระเงิน: {effectiveBooking.payment_status || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 md:p-6">
          <MiniStat
            icon={<CalendarDays size={22} />}
            label="จำนวนคืน"
            value={`${effectiveBooking.cart_data?.nights || effectiveBooking.nights || 1} คืน`}
          />
          <MiniStat
            icon={<ReceiptText size={22} />}
            label="จำนวนห้อง"
            value={`${summary.totalRooms} ห้อง`}
          />
          <MiniStat
            icon={<UserRound size={22} />}
            label="ผู้ใหญ่"
            value={`${summary.totalAdults} คน`}
          />
          <MiniStat
            icon={<UsersRound size={22} />}
            label="ผู้เข้าพักรวม"
            value={`${summary.totalGuests} คน`}
          />
        </div>

        <div
          className="grid gap-4 border-t p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6"
          style={{ borderColor: UI.line }}
        >
          <div
            className="rounded-[28px] border p-5"
            style={{
              background: UI.orangeSoft,
              borderColor: UI.line,
            }}
          >
            <p className="text-xs font-black" style={{ color: UI.muted }}>
              หมายเลขอ้างอิง
            </p>

            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="break-all text-xl font-black">{ref}</p>

              <button
                type="button"
                onClick={copyReference}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black"
                style={{
                  background: UI.paper,
                  border: `1px solid ${UI.line}`,
                  color: UI.orange,
                }}
              >
                <Copy size={15} />
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ActionButton
              label="ยืนยันสลิป / ยืนยันห้อง"
              icon={
                updatingAction === "CONFIRM_PAYMENT" ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )
              }
              disabled={!canConfirm || Boolean(updatingAction)}
              color={UI.green}
              onClick={() => updateBookingStatus("CONFIRM_PAYMENT")}
            />

            <ActionButton
              label="ปฏิเสธสลิป"
              icon={
                updatingAction === "REJECT_PAYMENT" ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <ShieldX size={18} />
                )
              }
              disabled={!canReject || Boolean(updatingAction)}
              color={UI.orange}
              onClick={() => updateBookingStatus("REJECT_PAYMENT")}
            />

            <ActionButton
              label="ยกเลิกจอง"
              icon={
                updatingAction === "CANCEL_BOOKING" ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <XCircle size={18} />
                )
              }
              disabled={!canCancel || Boolean(updatingAction)}
              color={UI.red}
              onClick={() => updateBookingStatus("CANCEL_BOOKING")}
            />
          </div>
        </div>

        {isCancelled && (
          <div className="border-t p-5 md:p-6" style={{ borderColor: UI.line }}>
            <div
              className="rounded-[28px] border p-5"
              style={{
                background: UI.redSoft,
                borderColor: "#fecdd3",
              }}
            >
              <div className="flex gap-4">
                <AlertTriangle className="shrink-0" color={UI.red} size={26} />
                <div>
                  <h3 className="text-xl font-black text-red-700">
                    รายการนี้ถูกยกเลิกแล้ว
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-red-600">
                    ระบบตรวจพบว่ารายการนี้ไม่ได้แนบสลิปภายใน 1 ชั่วโมง
                    หรือถูกแอดมินยกเลิกแล้ว ห้องของรายการนี้จะไม่ถูกนับเป็นการจองที่ยืนยัน
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-7 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-7">
          <Panel
            label="Booked Rooms"
            title="รายการห้องที่จอง"
            subtitle="แสดงข้อมูลห้อง จำนวนห้อง จำนวนคน และยอดเงินของแต่ละรายการ"
          >
            <div className="grid gap-4">
              {(effectiveBooking.cart_data?.items || []).length === 0 ? (
                <EmptyBox text="ไม่มีข้อมูลห้องใน cart_data" />
              ) : (
                effectiveBooking.cart_data?.items?.map((item, index) => (
                  <RoomItem
                    key={item.cartId || `${item.roomName}-${index}`}
                    item={item}
                    index={index}
                    nights={
                      effectiveBooking.cart_data?.nights ||
                      effectiveBooking.nights ||
                      1
                    }
                    checkIn={
                      effectiveBooking.cart_data?.checkIn ||
                      effectiveBooking.check_in
                    }
                    checkOut={
                      effectiveBooking.cart_data?.checkOut ||
                      effectiveBooking.check_out
                    }
                  />
                ))
              )}
            </div>
          </Panel>

          <Panel
            label="Guest"
            title="ข้อมูลผู้เข้าพัก"
            subtitle="ระบบใช้ข้อมูลนี้สำหรับเช็กอินและติดต่อกลับ"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                icon={<UserRound size={18} />}
                label="ชื่อผู้เข้าพักหลัก"
                value={mainGuest?.guestName || effectiveBooking.customer_name || "-"}
              />
              <InfoCard
                icon={<CreditCard size={18} />}
                label="สัญชาติ"
                value={mainGuest?.nationality || "-"}
              />
              <InfoCard
                icon={<Clock3 size={18} />}
                label="ถึงที่พักประมาณ"
                value={mainGuest?.arrivalTime || "-"}
              />
              <InfoCard
                icon={<UsersRound size={18} />}
                label="จำนวนผู้เข้าพัก"
                value={`${summary.totalGuests} คน`}
              />
            </div>

            {mainGuest?.note && (
              <div
                className="mt-4 rounded-[24px] border p-4 text-sm font-semibold leading-7"
                style={{
                  background: UI.orangeSoft,
                  borderColor: UI.line,
                  color: UI.muted,
                }}
              >
                <span className="font-black text-black">หมายเหตุ: </span>
                {mainGuest.note}
              </div>
            )}
          </Panel>

          <Panel
            label="Group Benefit"
            title="สิทธิ์กลุ่มที่ได้รับ"
            subtitle="คำนวณจากจำนวนผู้ใหญ่รวมทุกห้อง"
          >
            <div
              className="rounded-[30px] border p-5"
              style={{
                background:
                  groupBenefit.level === "NONE" ? UI.orangeSoft : UI.greenSoft,
                borderColor:
                  groupBenefit.level === "NONE" ? UI.line : "#bbf7d0",
              }}
            >
              <div className="flex gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{
                    background:
                      groupBenefit.level === "NONE" ? UI.black : UI.green,
                  }}
                >
                  <ShieldCheck size={26} />
                </div>

                <div>
                  <h3 className="text-2xl font-black">
                    {groupBenefit.title || "-"}
                  </h3>
                  <p
                    className="mt-1 text-sm font-black"
                    style={{
                      color:
                        groupBenefit.level === "NONE" ? UI.orange : UI.green,
                    }}
                  >
                    {groupBenefit.subtitle || ""}
                  </p>
                  <p
                    className="mt-2 text-sm font-semibold leading-7"
                    style={{ color: UI.muted }}
                  >
                    {groupBenefit.description || ""}
                  </p>
                  <p className="mt-2 text-xs font-black" style={{ color: UI.muted }}>
                    ผู้ใหญ่รวม {summary.totalAdults} คน • เด็ก{" "}
                    {summary.totalChildren} คน
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <aside className="grid gap-7 xl:sticky xl:top-24 xl:self-start">
          <Panel
            label="Customer"
            title="ข้อมูลผู้จอง"
            subtitle="ข้อมูลติดต่อของลูกค้า"
          >
            <div className="grid gap-3">
              <InfoCard
                icon={<UserRound size={18} />}
                label="ชื่อผู้จอง"
                value={effectiveBooking.customer_name || "-"}
              />
              <InfoCard
                icon={<Phone size={18} />}
                label="เบอร์โทร"
                value={effectiveBooking.customer_phone || "-"}
              />
              <InfoCard
                icon={<Mail size={18} />}
                label="อีเมล"
                value={effectiveBooking.customer_email || "-"}
              />
              <InfoCard
                icon={<UsersRound size={18} />}
                label="LINE User ID"
                value={effectiveBooking.line_user_id || "-"}
              />
            </div>
          </Panel>

          <Panel
            label="Payment Proof"
            title="หลักฐานการชำระเงิน"
            subtitle="ตรวจสอบสลิปก่อนยืนยันห้อง"
          >
            {effectiveBooking.payment_slip_url ? (
              <div className="grid gap-4">
                <a
                  href={effectiveBooking.payment_slip_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block h-[420px] overflow-hidden rounded-[30px] border bg-slate-100"
                  style={{ borderColor: UI.line }}
                >
                  <Image
                    src={effectiveBooking.payment_slip_url}
                    alt="Payment slip"
                    fill
                    sizes="420px"
                    className="object-contain p-3"
                    unoptimized
                  />

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/70 px-4 py-3 text-sm font-black text-white opacity-0 transition group-hover:opacity-100">
                    <Eye size={18} />
                    เปิดดูสลิป
                  </div>
                </a>

                <a
                  href={effectiveBooking.payment_slip_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white"
                  style={{
                    background: UI.orange,
                    boxShadow: "0 12px 28px rgba(249,115,22,0.20)",
                  }}
                >
                  <FileImage size={18} />
                  เปิดรูปสลิปเต็ม
                </a>
              </div>
            ) : (
              <EmptySlipBox isCancelled={isCancelled} />
            )}
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Panel({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[36px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="border-b p-5 md:p-6"
        style={{
          borderColor: UI.line,
          background:
            "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
        }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.22em]"
          style={{ color: UI.orange }}
        >
          {label}
        </p>

        <h2 className="mt-2 text-3xl font-black">{title}</h2>

        {subtitle && (
          <p
            className="mt-1 text-sm font-semibold leading-6"
            style={{ color: UI.muted }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function RoomItem({
  item,
  index,
  nights,
  checkIn,
  checkOut,
}: {
  item: BookingCartItem;
  index: number;
  nights: number;
  checkIn?: string;
  checkOut?: string;
}) {
  const quantity = Number(item.quantity || 1);
  const adults = Number(item.adults || 0) * quantity;
  const children = Number(item.children || 0) * quantity;
  const guests = adults + children;
  const total = Number(item.totalAmount || 0);
  const image = item.coverImage || item.image || "/images/tent-1.jpg";

  return (
    <article
      className="overflow-hidden rounded-[32px] border"
      style={{
        background: UI.paper,
        borderColor: UI.line,
      }}
    >
      <div className="grid gap-5 p-4 md:grid-cols-[150px_1fr_auto] md:items-center md:p-5">
        <div className="relative h-36 overflow-hidden rounded-[26px] bg-slate-200 md:h-32">
          <Image
            src={image}
            alt={item.roomName || "room"}
            fill
            sizes="150px"
            className="object-cover"
          />
        </div>

        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.18em]"
            style={{ color: UI.orange }}
          >
            ห้องที่ {index + 1}
          </p>

          <h3 className="mt-1 text-2xl font-black">
            {item.roomName || "รายการห้อง"}
          </h3>

          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            {formatDateShort(checkIn)} - {formatDateShort(checkOut)} • {nights} คืน
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MiniTag icon={<ReceiptText size={15} />} text={`${quantity} ห้อง`} />
            <MiniTag icon={<UserRound size={15} />} text={`ผู้ใหญ่ ${adults}`} />
            <MiniTag icon={<UsersRound size={15} />} text={`เด็ก ${children}`} />
            <MiniTag icon={<UsersRound size={15} />} text={`รวม ${guests} คน`} />
          </div>
        </div>

        <div
          className="rounded-[26px] px-5 py-4 text-left md:min-w-[150px] md:text-right"
          style={{
            background: UI.black,
            color: "#ffffff",
          }}
        >
          <p className="text-xs font-bold text-white/55">ยอดรายการ</p>
          <p className="mt-1 text-3xl font-black" style={{ color: UI.orange }}>
            ฿{total.toLocaleString()}
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[28px] border p-4"
      style={{
        background: UI.orangeSoft,
        borderColor: UI.line,
      }}
    >
      <div style={{ color: UI.orange }}>{icon}</div>
      <p className="mt-3 text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[24px] border p-4"
      style={{
        background: UI.blueSoft,
        borderColor: "#e2e8f0",
      }}
    >
      <div className="flex items-center gap-2" style={{ color: UI.orange }}>
        {icon}
        <p className="text-xs font-black" style={{ color: UI.muted }}>
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-black">{value}</p>
    </div>
  );
}

function MiniTag({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
      style={{
        background: UI.orangeSoft,
        border: `1px solid ${UI.line}`,
        color: UI.black,
      }}
    >
      <span style={{ color: UI.orange }}>{icon}</span>
      {text}
    </span>
  );
}

function ActionButton({
  label,
  icon,
  color,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        background: color,
        boxShadow: disabled ? "none" : "0 12px 28px rgba(15,23,42,0.14)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptySlipBox({ isCancelled }: { isCancelled: boolean }) {
  return (
    <div
      className="rounded-[30px] border border-dashed p-8 text-center"
      style={{
        background: isCancelled ? UI.redSoft : UI.orangeSoft,
        borderColor: isCancelled ? "#fecdd3" : UI.line,
      }}
    >
      {isCancelled ? (
        <XCircle className="mx-auto" size={50} color={UI.red} />
      ) : (
        <WalletCards className="mx-auto" size={50} color={UI.orange} />
      )}

      <h3 className="mt-4 text-2xl font-black">
        {isCancelled ? "ไม่มีสลิป เพราะรายการถูกยกเลิก" : "ยังไม่มีสลิป"}
      </h3>

      <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
        {isCancelled
          ? "รายการนี้หมดเวลาชำระเงินหรือถูกยกเลิกแล้ว"
          : "ลูกค้ายังไม่ได้แจ้งชำระเงิน"}
      </p>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      className="rounded-[28px] border border-dashed p-8 text-center text-sm font-black"
      style={{
        background: UI.orangeSoft,
        borderColor: UI.line,
        color: UI.muted,
      }}
    >
      {text}
    </div>
  );
}

function getBookingSummary(booking: BookingRow) {
  const items = booking.cart_data?.items || [];

  if (items.length === 0) {
    return {
      totalRooms: Number(booking.total_rooms || 0),
      totalAdults: Number(booking.total_guests || 0),
      totalChildren: 0,
      totalGuests: Number(booking.total_guests || 0),
    };
  }

  const totalRooms = items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  const totalAdults = items.reduce((sum, item) => {
    return sum + Number(item.adults || 0) * Number(item.quantity || 1);
  }, 0);

  const totalChildren = items.reduce((sum, item) => {
    return sum + Number(item.children || 0) * Number(item.quantity || 1);
  }, 0);

  return {
    totalRooms,
    totalAdults,
    totalChildren,
    totalGuests: totalAdults + totalChildren,
  };
}

function getGroupBenefit(adults: number): GroupBenefit {
  if (adults >= 10) {
    return {
      level: "PARTY",
      title: "ได้รับสิทธิ์ห้องปาร์ตี้ส่วนตัว",
      subtitle: "ครบ 10 คนขึ้นไป",
      description:
        "ฟรีห้องปาร์ตี้ส่วนตัว พร้อมคาราโอเกะ โต๊ะพูล และห้องพักในตัว 2 ห้อง",
      badge: "ฟรีห้องปาร์ตี้",
    };
  }

  if (adults >= 6) {
    return {
      level: "KARAOKE",
      title: "ได้รับสิทธิ์ห้องคาราโอเกะส่วนตัว",
      subtitle: "ครบ 6 คนขึ้นไป",
      description: "ฟรีห้องคาราโอเกะส่วนตัว ร้องได้ทั้งคืน",
      badge: "ฟรีคาราโอเกะ",
    };
  }

  const remain = Math.max(6 - adults, 0);

  return {
    level: "NONE",
    title: "ยังไม่ถึงโปรกลุ่ม",
    subtitle: `เพิ่มผู้ใหญ่อีก ${remain} คน จะได้ห้องคาราโอเกะ`,
    description:
      "ครบ 6 คนขึ้นไป ฟรีห้องคาราโอเกะ / ครบ 10 คนขึ้นไป ฟรีห้องปาร์ตี้",
    badge: "ยังไม่ได้โปร",
  };
}

function getBookingExpireTime(booking: BookingRow) {
  if (booking.expire_at) {
    const expireAt = new Date(booking.expire_at).getTime();

    if (!Number.isNaN(expireAt)) {
      return expireAt;
    }
  }

  const createdAt = new Date(booking.created_at || Date.now()).getTime();

  if (Number.isNaN(createdAt)) {
    return Date.now() + 60 * 60 * 1000;
  }

  return createdAt + 60 * 60 * 1000;
}

function isBookingExpiredWithoutSlip(booking: BookingRow, now: number) {
  const isWaitingPayment =
    booking.payment_status === "WAITING_PAYMENT" ||
    booking.booking_status === "PENDING_PAYMENT";

  const hasSlip = Boolean(booking.payment_slip_url || booking.payment_slip_path);

  const alreadyFinal =
    booking.booking_status === "CANCELLED" ||
    booking.payment_status === "CANCELLED" ||
    booking.booking_status === "CONFIRMED" ||
    booking.payment_status === "PAID" ||
    booking.payment_status === "WAITING_VERIFY";

  if (alreadyFinal) return false;
  if (!isWaitingPayment) return false;
  if (hasSlip) return false;

  return now >= getBookingExpireTime(booking);
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

function getStatusText(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return "ยกเลิกแล้ว";
  }

  if (paymentStatus === "WAITING_VERIFY") {
    return "รอตรวจสลิป";
  }

  if (paymentStatus === "PAID" || bookingStatus === "CONFIRMED") {
    return "ยืนยันแล้ว";
  }

  if (
    paymentStatus === "WAITING_PAYMENT" ||
    bookingStatus === "PENDING_PAYMENT"
  ) {
    return "รอชำระเงิน";
  }

  return "รอดำเนินการ";
}

function getStatusStyle(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return {
      bg: UI.redSoft,
      text: UI.red,
      icon: <XCircle size={15} />,
    };
  }

  if (paymentStatus === "WAITING_VERIFY") {
    return {
      bg: UI.orangeSoft,
      text: UI.orange,
      icon: <AlertTriangle size={15} />,
    };
  }

  if (paymentStatus === "PAID" || bookingStatus === "CONFIRMED") {
    return {
      bg: UI.greenSoft,
      text: UI.green,
      icon: <CheckCircle2 size={15} />,
    };
  }

  return {
    bg: UI.yellowSoft,
    text: UI.orange,
    icon: <Clock3 size={15} />,
  };
}

function formatDateShort(value?: string) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  const months = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
