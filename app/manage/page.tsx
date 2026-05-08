"use client";

import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileImage,
  Gift,
  Home,
  Loader2,
  ReceiptText,
  Search,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type BookingGuest = {
  roomCartId: string;
  guestName: string;
  useBookerInfo?: boolean;
  nationality?: string;
  arrivalTime?: string;
  note?: string;
  totalGuests?: number;
};

type BookingCartItem = {
  cartId: string;
  roomTypeId?: string;
  roomName: string;
  roomSlug?: string;
  quantity: number;
  adults: number;
  children: number;
  totalGuests: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  totalAmount?: number;
  coverImage?: string;

  dealTitle?: string;
  price?: number;
  image?: string;
  note?: string;
};

type GroupBenefit = {
  level: "NONE" | "KARAOKE" | "PARTY";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  assigned?: boolean;
  capacity?: number;
  remaining?: number;
};

type LatestBooking = {
  bookingCode: string;
  lineUserId?: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    contact: string;
  };
  guests?: BookingGuest[];
  groupBenefit?: GroupBenefit;
  summary?: {
    totalRooms?: number;
    totalAdults?: number;
    totalChildren?: number;
    totalGuests?: number;
    groupBenefit?: GroupBenefit;
  };
  payment: {
    method: string;
    reference: string;
    slipFileName: string;
    slipUrl?: string;
    paymentReference?: string;
    expireAt?: string;
    status: string;
  };
  cart: {
    checkIn?: string;
    checkOut?: string;
    nights: number;
    items: BookingCartItem[];
    total: number;
    savedAt: string;
    groupBenefit?: GroupBenefit;
  };
  finalAmount: number;
  createdAt: string;
  status: string;
};

type DatabaseBookingRow = {
  id?: string;
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
  payment_slip_url?: string;
  payment_slip_path?: string;
  expire_at?: string;

  cart_data?: LatestBooking["cart"];
  guest_data?: BookingGuest[];
  summary_data?: LatestBooking["summary"];
  group_benefit?: GroupBenefit;

  created_at?: string;
  updated_at?: string;
};

type GetBookingsResponse = {
  bookings?: DatabaseBookingRow[];
  message?: string;
  error?: string;
};

type UploadSlipResponse = {
  message?: string;
  slipUrl?: string;
  slipPath?: string;
  booking?: DatabaseBookingRow;
  error?: string;
  details?: string;
  hint?: string;
};

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  ink: "#101010",
  muted: "#64748b",
  black: "#101010",
  orange: "#f97316",
  orangeSoft: "#fff7ed",
  line: "#e8ddd0",
  green: "#16a34a",
  greenSoft: "#ecfdf5",
  red: "#dc2626",
  redSoft: "#fff1f2",
  blueSoft: "#f8fafc",
};

export default function ManagePage() {
  const [bookings, setBookings] = useState<LatestBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipFileName, setSlipFileName] = useState("");

  const [submittingSlip, setSubmittingSlip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    setMounted(true);
    loadUserBookings();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bookings.length === 0) return;

    const updatedBookings = bookings.map((booking) => {
      const isWaitingPayment =
        booking.status === "PENDING_PAYMENT" ||
        booking.payment.status === "WAITING_PAYMENT";

      const hasSlip = Boolean(
        booking.payment.slipFileName || booking.payment.slipUrl
      );

      const expireAt = getExpireTime(booking);

      if (isWaitingPayment && !hasSlip && expireAt <= Date.now()) {
        return {
          ...booking,
          status: "CANCELLED",
          payment: {
            ...booking.payment,
            status: "CANCELLED",
          },
        };
      }

      return booking;
    });

    const changed = JSON.stringify(updatedBookings) !== JSON.stringify(bookings);

    if (changed) {
      setBookings(updatedBookings);
      saveBookingList(updatedBookings);
    }
  }, [now, bookings]);

  useEffect(() => {
    const selected = bookings.find(
      (booking) => getBookingIdentity(booking) === selectedBookingId
    );

    if (selected) {
      setSlipFile(null);
      setSlipFileName(selected.payment.slipFileName || "");
    }
  }, [selectedBookingId, bookings]);

  useEffect(() => {
    if (!paymentPopupOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPaymentPopupOpen(false);
      }
    }

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleEsc);
    };
  }, [paymentPopupOpen]);

  async function loadUserBookings() {
    try {
      const currentLineUserId = getCurrentDevLineUserId();

      if (currentLineUserId) {
        const response = await fetch(
          `/api/bookings?lineUserId=${encodeURIComponent(currentLineUserId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = (await response.json()) as GetBookingsResponse;

        if (response.ok && Array.isArray(result.bookings)) {
          const dbBookings = result.bookings
            .map(mapDatabaseBookingToClient)
            .map((booking) => normalizeBookingNumbers(booking))
            .map((booking) => ensureExpireAt(booking))
            .sort((a, b) => {
              return (
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
              );
            });

          setBookings(dbBookings);
          saveBookingList(dbBookings);

          if (dbBookings.length > 0) {
            setSelectedBookingId(getBookingIdentity(dbBookings[0]));
          }

          setLoading(false);
          return;
        }

        console.warn("GET_BOOKINGS_FROM_DATABASE_FAILED", result);
      }

      loadUserBookingsFromLocalStorage();
    } catch (error) {
      console.error("LOAD_USER_BOOKINGS_ERROR", error);
      loadUserBookingsFromLocalStorage();
    } finally {
      setLoading(false);
    }
  }

  function loadUserBookingsFromLocalStorage() {
    try {
      const currentLineUserId = getCurrentDevLineUserId();

      const rawList = localStorage.getItem("camp_user_bookings");
      const rawLatest = localStorage.getItem("camp_latest_booking");

      const listFromStorage: LatestBooking[] = rawList ? JSON.parse(rawList) : [];
      const latestBooking: LatestBooking | null = rawLatest
        ? JSON.parse(rawLatest)
        : null;

      const merged = dedupeBookings([
        ...listFromStorage,
        ...(latestBooking ? [latestBooking] : []),
      ])
        .map((booking) => normalizeBookingNumbers(booking))
        .map((booking) => ensureExpireAt(booking));

      const filtered =
        currentLineUserId && merged.some((item) => item.lineUserId)
          ? merged.filter((item) => item.lineUserId === currentLineUserId)
          : merged;

      const sorted = filtered.sort((a, b) => {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });

      setBookings(sorted);
      saveBookingList(sorted);

      if (sorted.length > 0) {
        setSelectedBookingId(getBookingIdentity(sorted[0]));
      }
    } catch (error) {
      console.error("LOAD_LOCAL_BOOKINGS_ERROR", error);
      setBookings([]);
    }
  }

  function saveBookingList(nextBookings: LatestBooking[]) {
    localStorage.setItem("camp_user_bookings", JSON.stringify(nextBookings));

    const latest = nextBookings[0];
    if (latest) {
      localStorage.setItem("camp_latest_booking", JSON.stringify(latest));
    }
  }

  function updateBooking(updatedBooking: LatestBooking) {
    const normalized = normalizeBookingNumbers(updatedBooking);

    const nextBookings = bookings.map((booking) => {
      if (getBookingIdentity(booking) === getBookingIdentity(normalized)) {
        return normalized;
      }

      return booking;
    });

    setBookings(nextBookings);
    saveBookingList(nextBookings);
  }

  async function submitSlip() {
    if (!selectedBooking) return;

    if (!slipFile) {
      alert("กรุณาอัปโหลดสลิปก่อน");
      return;
    }

    const paymentReference =
      selectedBooking.payment.paymentReference || selectedBooking.bookingCode || "";

    const lineUserId =
      selectedBooking.lineUserId || getCurrentDevLineUserId() || "demo-line-user-001";

    if (!paymentReference) {
      alert("ไม่พบเลขอ้างอิงรายการจอง");
      return;
    }

    setSubmittingSlip(true);

    try {
      const formData = new FormData();
      formData.append("slip", slipFile);
      formData.append("paymentReference", paymentReference);
      formData.append("lineUserId", lineUserId);

      const response = await fetch("/api/bookings/upload-slip", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as UploadSlipResponse;

      if (!response.ok) {
        console.error("UPLOAD_SLIP_ERROR", result);

        alert(
          [result.message, result.error, result.details, result.hint]
            .filter(Boolean)
            .join(" | ") || "อัปโหลดสลิปไม่สำเร็จ"
        );

        setSubmittingSlip(false);
        return;
      }

      const dbBooking = result.booking
        ? mapDatabaseBookingToClient(result.booking)
        : null;

      const updatedBooking: LatestBooking = dbBooking
        ? ensureExpireAt(normalizeBookingNumbers(dbBooking))
        : {
            ...selectedBooking,
            status: "PENDING",
            payment: {
              ...selectedBooking.payment,
              slipFileName: slipFile.name,
              slipUrl: result.slipUrl,
              status: "WAITING_VERIFY",
            },
          };

      updateBooking(updatedBooking);

      setSubmittingSlip(false);
      setPaymentPopupOpen(false);
      setSlipFile(null);
      setSlipFileName(updatedBooking.payment.slipFileName || slipFile.name);

      alert("ส่งหลักฐานแล้ว ตอนนี้รอแอดมินยืนยันห้อง");
    } catch (error) {
      console.error("UPLOAD_SLIP_CLIENT_ERROR", error);

      alert(error instanceof Error ? error.message : "อัปโหลดสลิปไม่สำเร็จ");

      setSubmittingSlip(false);
    }
  }

  async function copyReference() {
    if (!selectedBooking?.payment.paymentReference) return;

    try {
      await navigator.clipboard.writeText(selectedBooking.payment.paymentReference);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1300);
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  }

  const filteredBookings = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return bookings;

    return bookings.filter((booking) => {
      const ref = booking.payment.paymentReference || "";
      const code = booking.bookingCode || "";
      const customer = booking.customer.name || "";
      const rooms = booking.cart.items.map((item) => item.roomName).join(" ");

      return `${ref} ${code} ${customer} ${rooms}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [bookings, searchText]);

  const selectedBooking = useMemo(() => {
    return (
      bookings.find(
        (booking) => getBookingIdentity(booking) === selectedBookingId
      ) ||
      bookings[0] ||
      null
    );
  }, [bookings, selectedBookingId]);

  const selectedSummary = useMemo(() => {
    if (!selectedBooking) {
      return {
        totalRooms: 0,
        totalAdults: 0,
        totalChildren: 0,
        totalGuests: 0,
      };
    }

    return getBookingSummary(selectedBooking);
  }, [selectedBooking]);

  const groupBenefit = useMemo(() => {
    if (!selectedBooking) return getGroupBenefits(0);

    return (
      selectedBooking.summary?.groupBenefit ||
      selectedBooking.groupBenefit ||
      getGroupBenefits(selectedSummary.totalAdults)
    );
  }, [selectedBooking, selectedSummary.totalAdults]);

  const finalAmount =
    selectedBooking?.finalAmount || selectedBooking?.cart.total || 0;

  const paymentReference =
    selectedBooking?.payment.paymentReference ||
    selectedBooking?.bookingCode ||
    "-";

  const expireAt = selectedBooking ? getExpireTime(selectedBooking) : 0;
  const remainMs = Math.max(expireAt - now, 0);
  const countdownText = formatCountdown(remainMs);

  const mainGuest = selectedBooking ? getMainGuest(selectedBooking) : undefined;

  if (loading) {
    return (
      <main
        className="min-h-screen"
        style={{ background: UI.page, color: UI.ink }}
      >
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
          <div
            className="rounded-[34px] border p-10 text-center shadow-xl"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
            }}
          >
            <Loader2 className="mx-auto animate-spin" color={UI.orange} size={48} />
            <p className="mt-5 text-2xl font-black">กำลังโหลดรายการจอง</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
              กรุณารอสักครู่
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: UI.page, color: UI.ink }}
    >
      <section
        className="border-b"
        style={{
          background:
            "radial-gradient(circle at top left, #fff7ed 0%, #f6efe5 48%, #efe4d5 100%)",
          borderColor: UI.line,
        }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <Link
            href="/booking"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black transition hover:scale-[1.02]"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              color: UI.ink,
            }}
          >
            <ArrowLeft size={18} />
            กลับไปหน้าจอง
          </Link>

          <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_420px] lg:items-end">
            <div className="fade-up">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
                style={{
                  background: UI.paper,
                  color: UI.orange,
                  border: `1px solid ${UI.line}`,
                }}
              >
                <ReceiptText size={16} />
                My Bookings
              </div>

              <h1 className="mt-5 max-w-4xl text-[2.25rem] font-black leading-[1.08] sm:text-5xl md:text-6xl">
                รายการจองของฉัน
                <span style={{ color: UI.orange }}> ทั้งหมด</span>
              </h1>

              <p
                className="mt-5 max-w-2xl text-sm font-semibold leading-7 md:text-base"
                style={{ color: UI.muted }}
              >
                แสดงรายการจองของผู้ใช้ปัจจุบัน เลือกรายการเพื่อดูรายละเอียด
                แจ้งชำระเงิน และติดตามสถานะการยืนยันห้อง
              </p>
            </div>

            <div
              className="rounded-[34px] border p-5 shadow-sm"
              style={{
                background: UI.paper,
                borderColor: UI.line,
                boxShadow: "0 18px 54px rgba(15,23,42,0.08)",
              }}
            >
              <p className="text-sm font-black" style={{ color: UI.muted }}>
                จำนวนรายการจอง
              </p>

              <p className="mt-2 text-4xl font-black sm:text-5xl" style={{ color: UI.orange }}>
                {bookings.length}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <SmallSummaryBox label="ห้อง" value={selectedSummary.totalRooms} />
                <SmallSummaryBox label="ผู้ใหญ่" value={selectedSummary.totalAdults} />
                <SmallSummaryBox label="รวมคน" value={selectedSummary.totalGuests} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {bookings.length === 0 ? (
          <EmptyBookingState />
        ) : (
          <div className="grid gap-7 lg:grid-cols-[410px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <BookingListPanel
                bookings={filteredBookings}
                selectedBookingId={getBookingIdentity(selectedBooking)}
                searchText={searchText}
                onSearchChange={setSearchText}
                onSelect={(booking) =>
                  setSelectedBookingId(getBookingIdentity(booking))
                }
              />
            </aside>

            {selectedBooking && (
              <section className="grid gap-7">
                <SelectedBookingHeader
                  booking={selectedBooking}
                  totalRooms={selectedSummary.totalRooms}
                  totalAdults={selectedSummary.totalAdults}
                  totalChildren={selectedSummary.totalChildren}
                  totalGuests={selectedSummary.totalGuests}
                  finalAmount={finalAmount}
                  paymentReference={paymentReference}
                  countdownText={countdownText}
                  copied={copied}
                  groupBenefit={groupBenefit}
                  onCopyReference={copyReference}
                  onOpenPayment={() => setPaymentPopupOpen(true)}
                />

                <section
                  className="overflow-hidden rounded-[34px] border shadow-sm"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                    boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
                  }}
                >
                  <SectionHeader
                    label="Guest Information"
                    title="ข้อมูลผู้เข้าพัก"
                    subtitle="ข้อมูลนี้กรอกครั้งเดียวและใช้กับรายการจองทั้งหมด"
                  />

                  <div className="grid gap-4 p-5 md:grid-cols-4 md:p-6">
                    <CleanInfo
                      icon={<UserRound size={18} />}
                      label="ชื่อผู้เข้าพักหลัก"
                      value={mainGuest?.guestName || selectedBooking.customer.name || "-"}
                    />

                    <CleanInfo
                      icon={<CreditCard size={18} />}
                      label="สัญชาติ"
                      value={mainGuest?.nationality || "-"}
                    />

                    <CleanInfo
                      icon={<Clock size={18} />}
                      label="ถึงที่พักประมาณ"
                      value={mainGuest?.arrivalTime || "-"}
                    />

                    <CleanInfo
                      icon={<UsersRound size={18} />}
                      label="ผู้เข้าพักรวม"
                      value={`${selectedSummary.totalGuests} คน`}
                    />
                  </div>

                  {mainGuest?.note && (
                    <div className="px-5 pb-5 md:px-6 md:pb-6">
                      <div
                        className="rounded-[24px] border p-4 text-sm font-semibold leading-7"
                        style={{
                          background: UI.orangeSoft,
                          borderColor: UI.line,
                          color: UI.muted,
                        }}
                      >
                        <span className="font-black text-black">หมายเหตุ: </span>
                        {mainGuest.note}
                      </div>
                    </div>
                  )}
                </section>

                <section
                  className="overflow-hidden rounded-[34px] border shadow-sm"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                    boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
                  }}
                >
                  <SectionHeader
                    label="Booking Detail"
                    title="รายการห้องที่จอง"
                    subtitle="แสดงรายการที่ถูกส่งมาจากตะกร้า พร้อมจำนวนคนที่คำนวณรวมทุกห้อง"
                  />

                  <div className="grid gap-4 p-5 md:p-6">
                    {selectedBooking.cart.items.map((item, index) => (
                      <RoomCard
                        key={item.cartId}
                        item={item}
                        guest={mainGuest}
                        index={index}
                        total={selectedBooking.cart.items.length}
                        nights={selectedBooking.cart.nights}
                        checkIn={selectedBooking.cart.checkIn || item.checkIn}
                        checkOut={selectedBooking.cart.checkOut || item.checkOut}
                        status={selectedBooking.status}
                        paymentStatus={selectedBooking.payment.status}
                      />
                    ))}
                  </div>
                </section>
              </section>
            )}
          </div>
        )}
      </section>

      {mounted &&
        paymentPopupOpen &&
        selectedBooking &&
        createPortal(
          <PaymentPopup
            booking={selectedBooking}
            finalAmount={finalAmount}
            paymentReference={paymentReference}
            countdownText={countdownText}
            slipFileName={slipFileName}
            setSlipFile={setSlipFile}
            setSlipFileName={setSlipFileName}
            submittingSlip={submittingSlip}
            submitSlip={submitSlip}
            onClose={() => setPaymentPopupOpen(false)}
          />,
          document.body
        )}
    </main>
  );
}

function BookingListPanel({
  bookings,
  selectedBookingId,
  searchText,
  onSearchChange,
  onSelect,
}: {
  bookings: LatestBooking[];
  selectedBookingId: string;
  searchText: string;
  onSearchChange: (value: string) => void;
  onSelect: (booking: LatestBooking) => void;
}) {
  return (
    <section
      className="overflow-hidden rounded-[34px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="border-b p-5"
        style={{
          borderColor: UI.line,
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%, #ecfdf5 100%)",
        }}
      >
        <p
          className="text-xs font-black uppercase tracking-[0.22em]"
          style={{ color: UI.orange }}
        >
          Booking List
        </p>

        <h2 className="mt-2 text-2xl font-black">รายการจอง</h2>

        <label
          className="mt-4 flex h-12 items-center gap-3 rounded-2xl border px-4"
          style={{
            background: UI.paper,
            borderColor: UI.line,
          }}
        >
          <Search size={18} color={UI.orange} />
          <input
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ค้นหาเลขอ้างอิง / ชื่อห้อง"
            className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
          />
        </label>
      </div>

      <div className="max-h-[720px] overflow-y-auto p-3">
        {bookings.length === 0 ? (
          <div
            className="rounded-[26px] border border-dashed p-8 text-center"
            style={{
              background: UI.orangeSoft,
              borderColor: UI.line,
            }}
          >
            <p className="font-black">ไม่พบรายการที่ค้นหา</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {bookings.map((booking) => {
              const id = getBookingIdentity(booking);
              const active = id === selectedBookingId;
              const firstRoom = booking.cart.items[0];
              const totalAmount = booking.finalAmount || booking.cart.total || 0;
              const summary = getBookingSummary(booking);
              const benefit = getGroupBenefits(summary.totalAdults);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelect(booking)}
                  className="w-full rounded-[26px] border p-4 text-left transition hover:scale-[1.01]"
                  style={{
                    background: active ? UI.black : UI.paper,
                    borderColor: active ? UI.black : UI.line,
                    color: active ? "#ffffff" : UI.ink,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-[0.16em]"
                        style={{ color: active ? UI.orange : UI.muted }}
                      >
                        {booking.payment.paymentReference || booking.bookingCode}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-lg font-black">
                        {firstRoom?.roomName || "รายการจอง"}
                      </h3>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-3 py-2 text-xs font-black"
                      style={{
                        background: getStatusColor(
                          booking.status,
                          booking.payment.status
                        ).bg,
                        color: getStatusColor(
                          booking.status,
                          booking.payment.status
                        ).text,
                      }}
                    >
                      {getStatusText(booking.status, booking.payment.status)}
                    </span>
                  </div>

                  <div
                    className="mt-4 flex flex-wrap gap-2 text-xs font-black"
                    style={{
                      color: active ? "rgba(255,255,255,0.68)" : UI.muted,
                    }}
                  >
                    <span>{booking.cart.nights} คืน</span>
                    <span>•</span>
                    <span>{summary.totalRooms} ห้อง</span>
                    <span>•</span>
                    <span>ผู้ใหญ่ {summary.totalAdults}</span>
                    <span>•</span>
                    <span>รวม {summary.totalGuests} คน</span>
                  </div>

                  <div
                    className="mt-3 rounded-2xl px-3 py-2 text-xs font-black"
                    style={{
                      background:
                        benefit.level === "NONE"
                          ? active
                            ? "rgba(255,255,255,0.08)"
                            : UI.orangeSoft
                          : active
                          ? "rgba(22,163,74,0.18)"
                          : UI.greenSoft,
                      color:
                        benefit.level === "NONE"
                          ? active
                            ? "#fed7aa"
                            : UI.orange
                          : active
                          ? "#86efac"
                          : UI.green,
                    }}
                  >
                    {benefit.badge}
                  </div>

                  <p className="mt-4 text-2xl font-black" style={{ color: UI.orange }}>
                    ฿{totalAmount.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function SelectedBookingHeader({
  booking,
  totalRooms,
  totalAdults,
  totalChildren,
  totalGuests,
  finalAmount,
  paymentReference,
  countdownText,
  copied,
  groupBenefit,
  onCopyReference,
  onOpenPayment,
}: {
  booking: LatestBooking;
  totalRooms: number;
  totalAdults: number;
  totalChildren: number;
  totalGuests: number;
  finalAmount: number;
  paymentReference: string;
  countdownText: string;
  copied: boolean;
  groupBenefit: GroupBenefit;
  onCopyReference: () => void;
  onOpenPayment: () => void;
}) {
  const isCancelled = booking.status === "CANCELLED";
  const isWaitingVerify = booking.payment.status === "WAITING_VERIFY";
  const isPaid = booking.payment.status === "PAID";
  const isWaitingPayment =
    booking.status === "PENDING_PAYMENT" ||
    booking.payment.status === "WAITING_PAYMENT";

  return (
    <section
      className="overflow-hidden rounded-[36px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 22px 70px rgba(15,23,42,0.08)",
      }}
    >
      <div
        className="grid gap-6 p-6 lg:grid-cols-[1fr_310px] lg:items-center"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #1d1d1d 62%, #2b1708 100%)",
          color: "#ffffff",
        }}
      >
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.24em]"
            style={{ color: UI.orange }}
          >
            Selected Booking
          </p>

          <h2 className="mt-2 text-3xl font-black md:text-4xl">
            {getStatusText(booking.status, booking.payment.status)}
          </h2>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
            เลขอ้างอิง:{" "}
            <span className="font-black text-white">{paymentReference}</span>
          </p>
        </div>

        <div
          className="rounded-[28px] p-5"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p className="text-sm font-semibold text-white/55">ยอดชำระรวม</p>
          <p className="mt-1 text-4xl font-black" style={{ color: UI.orange }}>
            ฿{finalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-5 md:p-6">
        <MiniStat
          icon={<CalendarDays size={22} />}
          label="จำนวนคืน"
          value={`${booking.cart.nights} คืน`}
        />

        <MiniStat
          icon={<ReceiptText size={22} />}
          label="จำนวนห้อง"
          value={`${totalRooms} ห้อง`}
        />

        <MiniStat
          icon={<UsersRound size={22} />}
          label="ผู้ใหญ่"
          value={`${totalAdults} คน`}
        />

        <MiniStat
          icon={<UsersRound size={22} />}
          label="รวมผู้เข้าพัก"
          value={`${totalGuests} คน`}
        />

        <MiniStat
          icon={<Clock size={22} />}
          label={isWaitingPayment && !isCancelled ? "เวลาคงเหลือ" : "สถานะ"}
          value={
            isWaitingPayment && !isCancelled
              ? countdownText
              : getStatusText(booking.status, booking.payment.status)
          }
        />
      </div>

      <div
        className="mx-5 mb-5 rounded-[28px] border p-5 md:mx-6"
        style={{
          background: groupBenefit.level === "NONE" ? UI.orangeSoft : UI.greenSoft,
          borderColor: groupBenefit.level === "NONE" ? UI.line : "#bbf7d0",
        }}
      >
        <div className="flex gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background: groupBenefit.level === "NONE" ? UI.black : UI.green,
            }}
          >
            <Gift size={24} />
          </div>

          <div>
            <p className="text-xl font-black">{groupBenefit.title}</p>
            <p
              className="mt-1 text-sm font-black"
              style={{
                color: groupBenefit.level === "NONE" ? UI.orange : UI.green,
              }}
            >
              {groupBenefit.subtitle}
            </p>
            <p
              className="mt-2 text-sm font-semibold leading-6"
              style={{ color: UI.muted }}
            >
              {groupBenefit.description}
            </p>
            <p
              className="mt-2 text-xs font-black"
              style={{ color: UI.muted }}
            >
              นับจากผู้ใหญ่รวมทั้งหมด {totalAdults} คน • เด็ก {totalChildren} คน
            </p>
          </div>
        </div>
      </div>

      <div
        className="grid gap-4 border-t p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6"
        style={{ borderColor: UI.line }}
      >
        <div
          className="rounded-[26px] border p-4"
          style={{
            background: UI.orangeSoft,
            borderColor: UI.line,
          }}
        >
          <p className="text-xs font-black" style={{ color: UI.muted }}>
            หมายเลขอ้างอิง
          </p>

          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="break-all text-xl font-black">{paymentReference}</p>

            <button
              type="button"
              onClick={onCopyReference}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black"
              style={{
                background: UI.paper,
                color: UI.orange,
                border: `1px solid ${UI.line}`,
              }}
            >
              <Copy size={15} />
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPayment}
          disabled={isCancelled || isPaid || isWaitingVerify}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: isWaitingVerify || isPaid ? UI.green : UI.orange,
            boxShadow:
              isWaitingVerify || isPaid
                ? "0 12px 30px rgba(22,163,74,0.18)"
                : "0 12px 30px rgba(249,115,22,0.22)",
          }}
        >
          {isWaitingVerify ? (
            <>
              <CheckCircle2 size={20} />
              รอแอดมินยืนยัน
            </>
          ) : isPaid ? (
            <>
              <CheckCircle2 size={20} />
              ชำระแล้ว
            </>
          ) : (
            <>
              <Upload size={20} />
              แจ้งชำระ
            </>
          )}
        </button>
      </div>

      {isCancelled && (
        <div className="border-t p-5" style={{ borderColor: UI.line }}>
          <div
            className="rounded-[26px] border p-4"
            style={{
              background: UI.redSoft,
              borderColor: "#fecdd3",
            }}
          >
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0" color={UI.red} size={24} />
              <p className="text-sm font-black leading-6 text-red-700">
                รายการนี้ถูกยกเลิกแล้ว เนื่องจากไม่ได้แนบสลิปภายใน 1 ชั่วโมง
              </p>
            </div>
          </div>
        </div>
      )}

      {isWaitingVerify && (
        <div className="border-t p-5" style={{ borderColor: UI.line }}>
          <div
            className="rounded-[26px] border p-4"
            style={{
              background: UI.greenSoft,
              borderColor: "#bbf7d0",
            }}
          >
            <div className="flex gap-3">
              <ShieldCheck className="shrink-0" color={UI.green} size={24} />
              <p className="text-sm font-black leading-6 text-green-700">
                ได้รับสลิปแล้ว ตอนนี้รอแอดมินตรวจสอบและยืนยันห้องพัก
              </p>
            </div>
          </div>
        </div>
      )}

      {booking.payment.slipUrl && (
        <div className="border-t p-5" style={{ borderColor: UI.line }}>
          <a
            href={booking.payment.slipUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white"
            style={{ background: UI.black }}
          >
            <FileImage size={18} />
            เปิดดูสลิปที่อัปโหลดแล้ว
          </a>
        </div>
      )}
    </section>
  );
}

function PaymentPopup({
  booking,
  finalAmount,
  paymentReference,
  countdownText,
  slipFileName,
  setSlipFile,
  setSlipFileName,
  submittingSlip,
  submitSlip,
  onClose,
}: {
  booking: LatestBooking;
  finalAmount: number;
  paymentReference: string;
  countdownText: string;
  slipFileName: string;
  setSlipFile: (file: File | null) => void;
  setSlipFileName: (value: string) => void;
  submittingSlip: boolean;
  submitSlip: () => void;
  onClose: () => void;
}) {
  const [promptPayQrUrl, setPromptPayQrUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [slipPreviewUrl, setSlipPreviewUrl] = useState("");
  const previewUrl = slipPreviewUrl || booking.payment.slipUrl || "";

  useEffect(() => {
    let active = true;

    async function createQr() {
      try {
        setQrError("");

        const promptPayId = process.env.NEXT_PUBLIC_PROMPTPAY_ID || "";

        if (!promptPayId.trim()) {
          setQrError("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_PROMPTPAY_ID");
          setPromptPayQrUrl("");
          return;
        }

        const payload = generatePromptPayPayloadV2({
          promptPayId,
          amount: finalAmount,
          reference: paymentReference,
        });

        const dataUrl = await QRCode.toDataURL(payload, {
          width: 460,
          margin: 2,
          errorCorrectionLevel: "M",
        });

        if (active) {
          setPromptPayQrUrl(dataUrl);
        }
      } catch (error) {
        console.error("Generate PromptPay QR error:", error);

        if (active) {
          setPromptPayQrUrl("");
          setQrError(
            error instanceof Error
              ? error.message
              : "สร้าง QR พร้อมเพย์ไม่สำเร็จ"
          );
        }
      }
    }

    createQr();

    return () => {
      active = false;
    };
  }, [finalAmount, paymentReference]);

  useEffect(() => {
    return () => {
      if (slipPreviewUrl) {
        URL.revokeObjectURL(slipPreviewUrl);
      }
    };
  }, [slipPreviewUrl]);

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-md md:px-4 md:py-6"
      onMouseDown={onClose}
    >
      <div
        className="mobile-slide-panel max-h-[calc(100vh-32px)] w-full max-w-5xl overflow-y-auto rounded-[28px] shadow-2xl md:max-h-[calc(100vh-48px)] md:rounded-[36px]"
        style={{ background: UI.page }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="sticky top-0 z-20 p-4 md:p-6"
          style={{
            background:
              "linear-gradient(135deg, #101010 0%, #1d1d1d 62%, #2b1708 100%)",
            color: "#ffffff",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.24em]"
                style={{ color: UI.orange }}
              >
                Payment
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">แจ้งชำระเงิน</h2>

              <p className="mt-2 text-sm font-semibold text-white/60">
                กรุณาแนบสลิปภายใน {countdownText}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:h-12 md:w-12"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-4 md:p-7 lg:grid-cols-[1fr_390px]">
          <section
            className="overflow-hidden rounded-[34px] border shadow-sm"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
            }}
          >
            <SectionHeader
              label="PromptPay"
              title="QR พร้อมเพย์สำหรับชำระเงิน"
              subtitle="QR นี้ใส่ยอดชำระและเลขอ้างอิงไว้ใน payload แล้ว"
            />

            <div className="grid gap-5 p-5 md:grid-cols-[260px_1fr] md:p-6">
              <div
                className="rounded-[30px] p-5 text-center"
                style={{ background: UI.orangeSoft }}
              >
                <p className="font-black">PromptPay QR</p>

                <div className="mx-auto mt-4 flex h-48 w-48 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-sm sm:h-52 sm:w-52">
                  {promptPayQrUrl ? (
                    <Image
                      src={promptPayQrUrl}
                      alt="PromptPay QR"
                      width={208}
                      height={208}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : qrError ? (
                    <div className="px-3 text-center text-xs font-black text-red-600">
                      {qrError}
                    </div>
                  ) : (
                    <Loader2
                      className="animate-spin"
                      color={UI.orange}
                      size={42}
                    />
                  )}
                </div>

                <p className="mt-4 text-xs font-black" style={{ color: UI.muted }}>
                  ยอดชำระ
                </p>

                <p className="mt-1 text-4xl font-black" style={{ color: UI.orange }}>
                  ฿{finalAmount.toLocaleString()}
                </p>
              </div>

              <div className="grid content-start gap-3">
                <BankLine label="ชื่อบัญชี" value="ปราณี ศรีคำ" />
                <BankLine label="ธนาคาร" value="ธนาคารกรุงศรี " />
                <BankLine label="เลขบัญชี" value="213-1-43973-6" />

              

                
              </div>
            </div>
          </section>

          <section
            className="overflow-hidden rounded-[34px] border shadow-sm"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
            }}
          >
            <SectionHeader
              label="Payment Proof"
              title="อัปโหลดสลิป"
              subtitle="ส่งหลักฐานการชำระเงิน"
            />

            <div className="grid gap-4 p-5">
              <div
                className="rounded-[26px] p-4"
                style={{
                  background: UI.orangeSoft,
                  border: `1px solid ${UI.line}`,
                }}
              >
                <p className="text-xs font-black" style={{ color: UI.muted }}>
                  เหลือเวลา
                </p>
                <p className="mt-1 text-3xl font-black" style={{ color: UI.orange }}>
                  {countdownText}
                </p>
              </div>

              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-8 text-center"
                style={{
                  background: UI.orangeSoft,
                  borderColor: UI.orange,
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (!file) return;

                    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                    const maxSize = 5 * 1024 * 1024;

                    if (!allowedTypes.includes(file.type)) {
                      alert("รองรับเฉพาะไฟล์ jpg, png, webp เท่านั้น");
                      event.target.value = "";
                      return;
                    }

                    if (file.size > maxSize) {
                      alert("ไฟล์สลิปต้องมีขนาดไม่เกิน 5MB");
                      event.target.value = "";
                      return;
                    }

                    const objectUrl = URL.createObjectURL(file);
                    setSlipPreviewUrl((oldUrl) => {
                      if (oldUrl) {
                        URL.revokeObjectURL(oldUrl);
                      }

                      return objectUrl;
                    });
                    setSlipFile(file);
                    setSlipFileName(file.name);
                  }}
                />

                {slipFileName ? (
                  <>
                    {previewUrl ? (
                      <div className="relative h-56 w-full overflow-hidden rounded-[24px] border bg-white shadow-sm">
                        <Image
                          src={previewUrl}
                          alt={slipFileName || "Payment slip preview"}
                          fill
                          sizes="360px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <FileImage size={44} color={UI.green} />
                    )}
                    <p className="mt-4 break-all text-lg font-black">
                      {slipFileName}
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: UI.muted }}
                    >
                      คลิกเพื่อเปลี่ยนสลิป
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={44} color={UI.orange} />
                    <p className="mt-4 text-lg font-black">อัปโหลดสลิป</p>
                    <p className="text-sm font-semibold" style={{ color: UI.muted }}>
                      รองรับ jpg, png, webp ขนาดไม่เกิน 5MB
                    </p>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={submitSlip}
                disabled={submittingSlip || booking.status === "CANCELLED"}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: UI.orange }}
              >
                {submittingSlip ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    กำลังส่งหลักฐาน
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    ส่งหลักฐานการชำระเงิน
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  item,
  guest,
  index,
  total,
  nights,
  checkIn,
  checkOut,
  status,
  paymentStatus,
}: {
  item: BookingCartItem;
  guest?: BookingGuest;
  index: number;
  total: number;
  nights: number;
  checkIn?: string;
  checkOut?: string;
  status: string;
  paymentStatus: string;
}) {
  const imageSrc = item.coverImage || item.image || "/images/tent-1.jpg";

  const itemTotal =
    item.totalAmount ||
    Number(item.price || 0) * Number(item.quantity || 1) * Number(nights || 1);

  const dateText =
    checkIn && checkOut
      ? `${formatDateShort(checkIn)} - ${formatDateShort(checkOut)}`
      : `${nights} คืน`;

  const itemAdults = getItemAdults(item);
  const itemChildren = getItemChildren(item);
  const itemGuests = getItemTotalGuests(item);

  return (
    <article
      className="overflow-hidden rounded-[30px] border"
      style={{
        background: UI.paper,
        borderColor: UI.line,
      }}
    >
      <div className="grid gap-4 p-4 md:grid-cols-[150px_1fr_auto] md:items-center md:p-5">
        <div className="relative h-36 overflow-hidden rounded-[24px] bg-slate-200 md:h-28">
          <Image
            src={imageSrc}
            alt={item.roomName}
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
            ห้องที่ {index + 1}/{total}
          </p>

          <h3 className="mt-1 text-2xl font-black">{item.roomName}</h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <MiniTag icon={<CalendarDays size={15} />} text={dateText} />
            <MiniTag
              icon={<UsersRound size={15} />}
              text={`ผู้ใหญ่ ${itemAdults} เด็ก ${itemChildren}`}
            />
            <MiniTag icon={<ReceiptText size={15} />} text={`${item.quantity} ห้อง`} />
            <MiniTag icon={<UsersRound size={15} />} text={`รวม ${itemGuests} คน`} />
          </div>
        </div>

        <div
          className="rounded-[24px] px-4 py-4 text-left md:min-w-[150px] md:px-5 md:text-right"
          style={{
            background: UI.black,
            color: "#ffffff",
          }}
        >
          <p className="text-xs font-bold text-white/55">ยอดรายการ</p>
          <p className="mt-1 text-2xl font-black" style={{ color: UI.orange }}>
            ฿{itemTotal.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        className="grid gap-3 border-t p-4 md:grid-cols-4"
        style={{ borderColor: UI.line }}
      >
        <CleanInfo
          icon={<CheckCircle2 size={18} />}
          label="สถานะ"
          value={getStatusText(status, paymentStatus)}
        />

        <CleanInfo
          icon={<UserRound size={18} />}
          label="ผู้เข้าพักหลัก"
          value={guest?.guestName || "-"}
        />

        <CleanInfo
          icon={<CreditCard size={18} />}
          label="สัญชาติ"
          value={guest?.nationality || "-"}
        />

        <CleanInfo
          icon={<Clock size={18} />}
          label="ถึงที่พักประมาณ"
          value={guest?.arrivalTime || "-"}
        />
      </div>
    </article>
  );
}

function EmptyBookingState() {
  return (
    <div
      className="rounded-[36px] border border-dashed p-10 text-center"
      style={{
        background: "rgba(255,255,255,0.68)",
        borderColor: "#d6c9bb",
      }}
    >
      <ReceiptText className="mx-auto" size={58} color={UI.orange} />

      <h2 className="mt-5 text-3xl font-black">ยังไม่มีรายการจอง</h2>

      <p
        className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7"
        style={{ color: UI.muted }}
      >
        เมื่อคุณทำรายการจองแล้ว รายการจองทั้งหมดจะแสดงในหน้านี้
      </p>

      <Link
        href="/booking"
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white"
        style={{ background: UI.orange }}
      >
        <Home size={18} />
        เริ่มจองที่พัก
      </Link>
    </div>
  );
}

function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className="border-b p-6"
      style={{
        borderColor: UI.line,
        background:
          "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%, #ecfdf5 100%)",
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
      className="rounded-[26px] border p-4"
      style={{
        background: UI.orangeSoft,
        borderColor: UI.line,
      }}
    >
      <div style={{ color: UI.orange }}>{icon}</div>

      <p className="mt-3 text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>

      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function SmallSummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl border p-3 text-center"
      style={{ background: UI.orangeSoft, borderColor: UI.line }}
    >
      <p className="text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
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
        color: UI.ink,
        border: `1px solid ${UI.line}`,
      }}
    >
      <span style={{ color: UI.orange }}>{icon}</span>
      {text}
    </span>
  );
}

function CleanInfo({
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
      className="rounded-[22px] border p-4"
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

function BankLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="grid grid-cols-[110px_1fr] overflow-hidden rounded-2xl border"
      style={{ borderColor: UI.line }}
    >
      <div
        className="px-4 py-3 text-right text-sm font-black"
        style={{ background: UI.blueSoft, color: UI.muted }}
      >
        {label}
      </div>

      <div className="px-4 py-3 text-sm font-black">{value}</div>
    </div>
  );
}

function dedupeBookings(bookings: LatestBooking[]) {
  const map = new Map<string, LatestBooking>();

  bookings.forEach((booking) => {
    map.set(getBookingIdentity(booking), booking);
  });

  return Array.from(map.values());
}

function getBookingIdentity(booking: LatestBooking | null | undefined) {
  if (!booking) return "";

  return (
    booking.payment?.paymentReference ||
    booking.bookingCode ||
    booking.createdAt ||
    String(Math.random())
  );
}

function getCurrentDevLineUserId() {
  try {
    const raw =
      localStorage.getItem("rhino_line_profile") ||
      localStorage.getItem("camp_line_profile");

    if (!raw) return "demo-line-user-001";

    const profile = JSON.parse(raw) as { userId?: string };

    return profile.userId || "demo-line-user-001";
  } catch {
    return "demo-line-user-001";
  }
}

function ensureExpireAt(booking: LatestBooking) {
  if (booking.payment?.expireAt) return booking;

  const createdAt = new Date(booking.createdAt || Date.now()).getTime();
  const expireAt = new Date(createdAt + 60 * 60 * 1000).toISOString();

  return {
    ...booking,
    payment: {
      ...booking.payment,
      expireAt,
    },
  };
}

function getExpireTime(booking: LatestBooking) {
  const normalized = ensureExpireAt(booking);
  const expireAt = new Date(normalized.payment.expireAt || "").getTime();

  if (Number.isNaN(expireAt)) {
    const createdAt = new Date(booking.createdAt || Date.now()).getTime();
    return createdAt + 60 * 60 * 1000;
  }

  return expireAt;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${mm}:${ss}`;
}

function getStatusText(status: string, paymentStatus?: string) {
  if (status === "CANCELLED" || paymentStatus === "CANCELLED") {
    return "ยกเลิกแล้ว";
  }

  if (paymentStatus === "WAITING_VERIFY") {
    return "รอแอดมินยืนยันห้อง";
  }

  if (paymentStatus === "PAID" || status === "CONFIRMED") {
    return "ยืนยันการจองแล้ว";
  }

  if (status === "PENDING_PAYMENT" || paymentStatus === "WAITING_PAYMENT") {
    return "รอชำระเงิน";
  }

  if (status === "PENDING") {
    return "รอแอดมินยืนยันห้อง";
  }

  return "รอดำเนินการ";
}

function getStatusColor(status: string, paymentStatus?: string) {
  if (status === "CANCELLED" || paymentStatus === "CANCELLED") {
    return { bg: UI.redSoft, text: UI.red };
  }

  if (paymentStatus === "WAITING_VERIFY" || status === "PENDING") {
    return { bg: UI.orangeSoft, text: UI.orange };
  }

  if (paymentStatus === "PAID" || status === "CONFIRMED") {
    return { bg: UI.greenSoft, text: UI.green };
  }

  return { bg: UI.orangeSoft, text: UI.orange };
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

function mapDatabaseBookingToClient(row: DatabaseBookingRow): LatestBooking {
  const cart = row.cart_data || {
    checkIn: row.check_in || "",
    checkOut: row.check_out || "",
    nights: Number(row.nights || 1),
    items: [],
    total: Number(row.total_amount || 0),
    savedAt: row.created_at || new Date().toISOString(),
  };

  const booking: LatestBooking = {
    bookingCode: row.booking_no || "",
    lineUserId: row.line_user_id || "",
    customer: {
      name: row.customer_name || "",
      phone: row.customer_phone || "",
      email: row.customer_email || "",
      contact: row.customer_contact || "",
    },
    guests: row.guest_data || [],
    groupBenefit: row.group_benefit || cart.groupBenefit,
    summary: row.summary_data,
    payment: {
      method: "BANK_TRANSFER",
      reference: "",
      slipFileName: row.payment_slip_path
        ? row.payment_slip_path.split("/").pop() || ""
        : "",
      slipUrl: row.payment_slip_url || "",
      paymentReference: row.payment_reference || "",
      expireAt: row.expire_at || "",
      status: row.payment_status || "WAITING_PAYMENT",
    },
    cart,
    finalAmount: Number(row.total_amount || cart.total || 0),
    createdAt: row.created_at || new Date().toISOString(),
    status: row.booking_status || "PENDING_PAYMENT",
  };

  return normalizeBookingNumbers(booking);
}

function normalizeBookingNumbers(booking: LatestBooking): LatestBooking {
  const items = (booking.cart.items || []).map((item) => {
    const totalGuests = getItemTotalGuests(item);

    return {
      ...item,
      quantity: Number(item.quantity || 1),
      adults: Number(item.adults || 0),
      children: Number(item.children || 0),
      totalGuests,
    };
  });

  const nextBooking: LatestBooking = {
    ...booking,
    cart: {
      ...booking.cart,
      items,
    },
  };

  const summary = getBookingSummary(nextBooking);
  const groupBenefit =
    nextBooking.summary?.groupBenefit ||
    nextBooking.groupBenefit ||
    nextBooking.cart.groupBenefit ||
    getGroupBenefits(summary.totalAdults);

  return {
    ...nextBooking,
    groupBenefit,
    summary: {
      ...nextBooking.summary,
      ...summary,
      groupBenefit,
    },
  };
}

function getBookingSummary(booking: LatestBooking) {
  const totalRooms = booking.cart.items.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  const totalAdults = booking.cart.items.reduce((sum, item) => {
    return sum + getItemAdults(item);
  }, 0);

  const totalChildren = booking.cart.items.reduce((sum, item) => {
    return sum + getItemChildren(item);
  }, 0);

  const totalGuests = totalAdults + totalChildren;

  return {
    totalRooms,
    totalAdults,
    totalChildren,
    totalGuests,
  };
}

function getItemAdults(item: BookingCartItem) {
  return Number(item.adults || 0) * Number(item.quantity || 1);
}

function getItemChildren(item: BookingCartItem) {
  return Number(item.children || 0) * Number(item.quantity || 1);
}

function getItemTotalGuests(item: BookingCartItem) {
  return getItemAdults(item) + getItemChildren(item);
}

function getMainGuest(booking: LatestBooking) {
  if (!booking.guests || booking.guests.length === 0) return undefined;

  return (
    booking.guests.find((guest) => guest.roomCartId === "ALL_ROOMS") ||
    booking.guests[0]
  );
}

function getGroupBenefits(adults: number): GroupBenefit {
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

function generatePromptPayPayloadV2({
  promptPayId,
  amount,
  reference,
}: {
  promptPayId: string;
  amount: number;
  reference?: string;
}) {
  const normalizedId = normalizePromptPayId(promptPayId);
  const targetType = getPromptPayTargetType(normalizedId);
  const sanitizedReference = sanitizePromptPayReference(reference || "");

  const additionalData = sanitizedReference
    ? buildTag("05", sanitizedReference)
    : "";

  const payloadWithoutCrc =
    buildTag("00", "01") +
    buildTag("01", "11") +
    buildTag(
      "29",
      buildTag("00", "A000000677010111") + buildTag(targetType, normalizedId)
    ) +
    buildTag("58", "TH") +
    buildTag("53", "764") +
    buildTag("54", formatAmount(amount)) +
    (additionalData ? buildTag("62", additionalData) : "") +
    "6304";

  const crc = crc16CcittFalse(payloadWithoutCrc);

  return payloadWithoutCrc + crc;
}

function buildTag(id: string, value: string) {
  const length = String(value.length).padStart(2, "0");
  return `${id}${length}${value}`;
}

function normalizePromptPayId(value: string) {
  const raw = value.trim().replace(/[\s-]/g, "");

  if (!raw) {
    throw new Error("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_PROMPTPAY_ID");
  }

  if (/^0[689]\d{8}$/.test(raw)) {
    return `0066${raw.slice(1)}`;
  }

  if (/^66[689]\d{8}$/.test(raw)) {
    return `00${raw}`;
  }

  if (/^0066[689]\d{8}$/.test(raw)) {
    return raw;
  }

  if (/^\d{13}$/.test(raw)) {
    return raw;
  }

  if (/^\d{15}$/.test(raw)) {
    return raw;
  }

  throw new Error(
    "NEXT_PUBLIC_PROMPTPAY_ID ไม่ถูกต้อง ต้องเป็นเบอร์มือถือไทย, เลขบัตร 13 หลัก หรือ e-Wallet 15 หลัก"
  );
}

function getPromptPayTargetType(normalizedId: string) {
  if (/^0066[689]\d{8}$/.test(normalizedId)) {
    return "01";
  }

  if (/^\d{13}$/.test(normalizedId)) {
    return "02";
  }

  if (/^\d{15}$/.test(normalizedId)) {
    return "03";
  }

  throw new Error("รูปแบบ PromptPay ID ไม่ถูกต้อง");
}

function formatAmount(amount: number) {
  const numberAmount = Number(amount);

  if (!Number.isFinite(numberAmount) || numberAmount <= 0) {
    throw new Error("ยอดชำระไม่ถูกต้อง");
  }

  return numberAmount.toFixed(2);
}

function sanitizePromptPayReference(reference: string) {
  return reference.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
}

function crc16CcittFalse(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}
