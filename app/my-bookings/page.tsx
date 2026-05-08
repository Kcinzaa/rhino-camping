"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Home,
  Info,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

type LatestBooking = {
  bookingCode: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    contact: string;
  };
  guests: {
    roomCartId: string;
    guestName: string;
    useBookerInfo: boolean;
    nationality: string;
    bedType: string;
    arrivalTime: string;
    note: string;
  }[];
  policies: {
    accepted: boolean;
    acceptedAt: string;
  };
  payment: {
    method: string;
    reference: string;
    slipFileName: string;
    paymentReference?: string;
    pinCode?: string;
    expireAt?: string;
    status: string;
  };
  cart: {
    nights: number;
    items: {
      cartId: string;
      roomName: string;
      dealTitle: string;
      quantity: number;
      price: number;
      adults: number;
      children: number;
      totalGuests: number;
      note?: string;
    }[];
    total: number;
    savedAt: string;
  };
  finalAmount: number;
  createdAt: string;
  status: string;
};

export default function MyBookingsPage() {
  const [referenceInput, setReferenceInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [searched, setSearched] = useState(false);
  const [booking, setBooking] = useState<LatestBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const paymentReference = booking?.payment?.paymentReference || "-";
  const pinCode = booking?.payment?.pinCode || "-";

  const totalRooms = useMemo(() => {
    if (!booking) return 0;

    return booking.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [booking]);

  const totalGuests = useMemo(() => {
    if (!booking) return 0;

    return booking.cart.items.reduce((sum, item) => sum + item.totalGuests, 0);
  }, [booking]);

  function searchBooking() {
    setLoading(true);
    setSearched(true);

    setTimeout(() => {
      const raw = localStorage.getItem("camp_latest_booking");

      if (!raw) {
        setBooking(null);
        setLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as LatestBooking;

        const savedReference = parsed.payment?.paymentReference || "";
        const savedPin = parsed.payment?.pinCode || "";

        const referenceMatched =
          savedReference.trim().toLowerCase() ===
          referenceInput.trim().toLowerCase();

        const pinMatched =
          savedPin.trim().toLowerCase() === pinInput.trim().toLowerCase();

        if (referenceMatched && pinMatched) {
          setBooking(parsed);
        } else {
          setBooking(null);
        }
      } catch {
        setBooking(null);
      } finally {
        setLoading(false);
      }
    }, 500);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1400);
  }

  function getStatusText(status: string) {
    if (status === "PENDING_PAYMENT") return "รอชำระเงิน";
    if (status === "PENDING") return "รอตรวจสอบ";
    if (status === "CONFIRMED") return "ยืนยันการจองแล้ว";
    if (status === "CANCELLED") return "ยกเลิกแล้ว";
    return "รอดำเนินการ";
  }

  function getPaymentStatusText(status: string) {
    if (status === "WAITING_PAYMENT") return "รอชำระเงิน";
    if (status === "WAITING_VERIFY") return "รอตรวจสอบสลิป";
    if (status === "PAID") return "ชำระเงินแล้ว";
    if (status === "REJECTED") return "สลิปไม่ผ่าน";
    return "ยังไม่พบรายการชำระเงิน";
  }

  function formatThaiDateTime(value?: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  return (
    <div className="min-h-screen bg-[#f7f1e7]">
      <section className="relative overflow-hidden bg-[#122018] text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-[-12%] top-[-28%] h-96 w-96 rounded-full bg-[#e97732] blur-[120px]" />
          <div className="absolute right-[-10%] bottom-[-30%] h-96 w-96 rounded-full bg-green-400 blur-[120px]" />
        </div>

        <div className="camp-container relative z-10 py-14 md:py-20">
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black !text-white backdrop-blur-xl transition hover:bg-white/15"
          >
            <ArrowLeft size={17} className="!text-white" />
            กลับไปหน้าจอง
          </Link>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_440px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#ffb36a]">
                Manage Booking
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                จัดการการจอง
                <span className="block text-[#ffb36a]">ของฉัน</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/70">
                ตรวจสอบสถานะการจอง สถานะการชำระเงิน รายละเอียดผู้เข้าพัก
                และข้อมูลห้องพักของคุณด้วยหมายเลขอ้างอิงและรหัส PIN
              </p>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="shrink-0 text-[#ffb36a]" size={28} />
                <div>
                  <p className="font-black text-white">ข้อมูลปลอดภัย</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-white/60">
                    ใช้หมายเลขอ้างอิงและ PIN เพื่อดูข้อมูลการจองเฉพาะรายการของคุณ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="camp-container -mt-10 pb-20">
        <div className="relative z-20 rounded-[40px] border border-white bg-white p-5 shadow-2xl shadow-green-950/10 md:p-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
            <label className="rounded-[28px] border border-slate-200 bg-[#fff8ec] p-4 focus-within:border-[#e97732] focus-within:ring-4 focus-within:ring-orange-100">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                หมายเลขอ้างอิง
              </span>

              <input
                value={referenceInput}
                onChange={(event) => setReferenceInput(event.target.value)}
                placeholder="เช่น TMP202605051249834"
                className="mt-3 w-full bg-transparent text-lg font-black text-[#1f3d2b] outline-none placeholder:text-slate-300"
              />
            </label>

            <label className="rounded-[28px] border border-slate-200 bg-[#fff8ec] p-4 focus-within:border-[#e97732] focus-within:ring-4 focus-within:ring-orange-100">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                รหัส PIN
              </span>

              <input
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value)}
                placeholder="เช่น HKY643"
                className="mt-3 w-full bg-transparent text-lg font-black text-[#1f3d2b] outline-none placeholder:text-slate-300"
              />
            </label>

            <button
              onClick={searchBooking}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-[28px] bg-[#e97732] px-7 py-5 text-base font-black text-white shadow-xl shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-[#ff8b3d] disabled:bg-slate-300"
            >
              {loading ? (
                <>
                  <Loader2 size={21} className="animate-spin" />
                  กำลังค้นหา
                </>
              ) : (
                <>
                  <Search size={21} />
                  ค้นหาการจอง
                </>
              )}
            </button>
          </div>
        </div>

        {!searched && (
          <div className="mt-8 rounded-[40px] border border-dashed border-slate-300 bg-white/70 p-10 text-center">
            <LockKeyhole className="mx-auto text-[#e97732]" size={54} />

            <h2 className="mt-5 text-3xl font-black text-[#1f3d2b]">
              กรอกข้อมูลเพื่อค้นหาการจอง
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
              หมายเลขอ้างอิงและรหัส PIN จะถูกสร้างหลังจากกดชำระเงินผ่านธนาคาร
              และแสดงในหน้าชำระเงินของคุณ
            </p>
          </div>
        )}

        {searched && !loading && !booking && (
          <div className="mt-8 rounded-[40px] border border-red-100 bg-red-50 p-10 text-center">
            <AlertCircle className="mx-auto text-red-500" size={54} />

            <h2 className="mt-5 text-3xl font-black text-red-700">
              ไม่พบรายการจอง
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-red-600/80">
              กรุณาตรวจสอบหมายเลขอ้างอิงและรหัส PIN อีกครั้ง
              หรือกลับไปทำรายการจองใหม่
            </p>

            <Link
              href="/booking"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-3xl bg-[#1f3d2b] px-6 py-4 text-sm font-black text-white"
            >
              <Home size={18} />
              ไปหน้าจอง
            </Link>
          </div>
        )}

        {booking && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px]">
            <div className="grid gap-8">
              <section className="overflow-hidden rounded-[40px] border border-white bg-white shadow-xl shadow-green-950/8">
                <div className="bg-[#1f3d2b] p-6 text-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffb36a]">
                        Booking Status
                      </p>
                      <h2 className="mt-2 text-3xl font-black">
                        สถานะการจอง
                      </h2>
                    </div>

                    <div className="rounded-3xl bg-white/10 px-5 py-3 backdrop-blur-xl">
                      <p className="text-xs font-bold text-white/50">
                        สถานะปัจจุบัน
                      </p>
                      <p className="text-xl font-black text-[#ffb36a]">
                        {getStatusText(booking.status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-4 md:p-7">
                  <StatusCard
                    icon={<CreditCard size={24} />}
                    label="สถานะชำระเงิน"
                    value={getPaymentStatusText(booking.payment.status)}
                    color="orange"
                  />

                  <StatusCard
                    icon={<Clock size={24} />}
                    label="เวลาล็อคห้อง"
                    value={formatThaiDateTime(booking.payment.expireAt)}
                    color="green"
                  />

                  <StatusCard
                    icon={<UsersRound size={24} />}
                    label="ผู้เข้าพัก"
                    value={`${totalGuests} คน`}
                    color="dark"
                  />

                  <StatusCard
                    icon={<BedDouble size={24} />}
                    label="จำนวนห้อง"
                    value={`${totalRooms} ห้อง`}
                    color="dark"
                  />
                </div>

                <div className="border-t border-slate-100 p-5 md:p-7">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReferenceBox
                      label="หมายเลขอ้างอิง"
                      value={paymentReference}
                      onCopy={() => copyText(paymentReference)}
                      copied={copied}
                    />

                    <ReferenceBox
                      label="รหัส PIN"
                      value={pinCode}
                      onCopy={() => copyText(pinCode)}
                      copied={copied}
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
                <div className="overflow-hidden rounded-[36px] border border-white bg-white shadow-xl shadow-green-950/8">
                  <PanelHeader icon={<UserRound size={24} />} title="ข้อมูลผู้สั่ง" />

                  <InfoTable
                    rows={[
                      ["ชื่อ-นามสกุล:", booking.customer.name || "-"],
                      ["อีเมล:", booking.customer.email || "ไม่ระบุ"],
                      ["เบอร์โทร:", booking.customer.phone || "-"],
                      ["ช่องทางติดต่อ:", booking.customer.contact || "-"],
                    ]}
                  />
                </div>

                <div className="overflow-hidden rounded-[36px] border border-white bg-white shadow-xl shadow-green-950/8">
                  <PanelHeader icon={<CreditCard size={24} />} title="สรุปเงิน" />

                  <div className="grid grid-cols-[150px_1fr] text-base">
                    <SummaryRow label="ราคารวม:" value={`฿${booking.finalAmount.toLocaleString()}`} />
                    <SummaryRow
                      label="ชำระแล้ว:"
                      value={
                        booking.payment.status === "PAID"
                          ? `฿${booking.finalAmount.toLocaleString()}`
                          : "฿0"
                      }
                    />
                    <SummaryRow
                      label="ค้างชำระ:"
                      value={
                        booking.payment.status === "PAID"
                          ? "฿0"
                          : `฿${booking.finalAmount.toLocaleString()}`
                      }
                      danger={booking.payment.status !== "PAID"}
                    />
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-[40px] border border-white bg-white shadow-xl shadow-green-950/8">
                <div className="border-b border-slate-100 bg-gradient-to-r from-[#1f3d2b] to-[#2e5a3f] p-6 text-white">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffb36a]">
                    Booking Detail
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    รายละเอียดการจอง
                  </h2>
                </div>

                <div className="grid gap-8 p-5 md:p-7">
                  {booking.cart.items.map((item, index) => {
                    const guest = booking.guests.find(
                      (g) => g.roomCartId === item.cartId
                    );

                    return (
                      <div
                        key={item.cartId}
                        className="overflow-hidden rounded-[32px] border border-slate-200 bg-white"
                      >
                        <div className="bg-[#668492] px-6 py-5 text-center text-2xl font-black text-white">
                          ห้องที่ {index + 1}/{booking.cart.items.length}
                        </div>

                        <div className="p-5">
                          <div className="mb-5 flex flex-wrap items-center gap-3">
                            <div className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white">
                              สถานะ: {getStatusText(booking.status)}
                            </div>

                            <div className="rounded-2xl bg-[#f7f1e7] px-5 py-3 text-sm font-black text-[#1f3d2b]">
                              {booking.cart.nights} คืน
                            </div>
                          </div>

                          <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[160px_1fr]">
                            <div className="relative h-36 overflow-hidden rounded-2xl bg-slate-200">
                              <Image
                                src="/images/tent-1.jpg"
                                alt={item.roomName}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div>
                              <h3 className="text-2xl font-black text-[#1f3d2b]">
                                {item.roomName}
                              </h3>

                              <div className="mt-4 grid gap-3 md:grid-cols-4">
                                <MiniDetail
                                  icon={<CalendarDays size={18} />}
                                  label="วันที่"
                                  value="5-7 พ.ค. 2026"
                                />
                                <MiniDetail
                                  icon={<Clock size={18} />}
                                  label="จำนวนคืน"
                                  value={`${booking.cart.nights} คืน`}
                                />
                                <MiniDetail
                                  icon={<UsersRound size={18} />}
                                  label="ผู้เข้าพัก"
                                  value={`ผู้ใหญ่ ${item.adults} เด็ก ${item.children}`}
                                />
                                <MiniDetail
                                  icon={<CreditCard size={18} />}
                                  label="ราคา"
                                  value={`฿${(
                                    item.price *
                                    item.quantity *
                                    booking.cart.nights
                                  ).toLocaleString()}`}
                                  danger
                                />
                              </div>
                            </div>
                          </div>

                          <DetailBlock title="ผู้เข้าพัก">
                            <div className="grid gap-3 md:grid-cols-3">
                              <InfoPill
                                label="ชื่อผู้เข้าพัก"
                                value={guest?.guestName || "-"}
                              />
                              <InfoPill
                                label="รูปแบบเตียง"
                                value={guest?.bedType || "Mattress (King Size)"}
                              />
                              <InfoPill
                                label="ถึงที่พักประมาณ"
                                value={guest?.arrivalTime || "-"}
                              />
                            </div>
                          </DetailBlock>

                          <DetailBlock title="ประเภทราคา">
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] bg-slate-50 text-center text-sm font-black text-[#1f3d2b]">
                                <div className="row-span-2 flex items-center justify-center border-r border-slate-200 px-4 py-4">
                                  ชื่อประเภท
                                </div>
                                <div className="col-span-3 border-b border-slate-200 px-4 py-3">
                                  มื้ออาหาร
                                </div>
                                <div className="border-r border-slate-200 px-4 py-3">
                                  เช้า
                                </div>
                                <div className="border-r border-slate-200 px-4 py-3">
                                  กลางวัน
                                </div>
                                <div className="px-4 py-3">เย็น</div>
                              </div>

                              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] text-center">
                                <div className="border-r border-slate-200 px-4 py-5 font-semibold">
                                  {item.dealTitle}
                                </div>
                                <div className="border-r border-slate-200 px-4 py-5">
                                  <Check className="mx-auto text-green-600" />
                                </div>
                                <div className="border-r border-slate-200 px-4 py-5">
                                  <X className="mx-auto text-red-500" />
                                </div>
                                <div className="px-4 py-5">
                                  <Check className="mx-auto text-green-600" />
                                </div>
                              </div>
                            </div>
                          </DetailBlock>

                          <DetailBlock title="นโยบายการเปลี่ยนแปลงและยกเลิก">
                            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-center text-sm font-black text-[#8b5e34]">
                              ไม่สามารถเปลี่ยนแปลง / ยกเลิกได้
                            </div>
                          </DetailBlock>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="overflow-hidden rounded-[40px] border border-white bg-white shadow-2xl shadow-green-950/10">
                <div className="bg-[#1f3d2b] p-6 text-white">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#ffb36a]">
                    Summary
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    สรุปรายการ
                  </h2>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <SmallSummaryBox label="คืน" value={booking.cart.nights} />
                    <SmallSummaryBox label="ห้อง" value={totalRooms} />
                    <SmallSummaryBox label="คน" value={totalGuests} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="rounded-[28px] bg-[#fff8ec] p-5">
                    <p className="text-sm font-bold text-slate-500">
                      สถานะ
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#1f3d2b]">
                      {getStatusText(booking.status)}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[28px] bg-[#fff8ec] p-5">
                    <p className="text-sm font-bold text-slate-500">
                      ชำระเงิน
                    </p>
                    <p className="mt-2 text-2xl font-black text-[#e97732]">
                      {getPaymentStatusText(booking.payment.status)}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[28px] bg-[#1f3d2b] p-5 text-white">
                    <p className="text-sm font-bold text-white/60">
                      ยอดรวม
                    </p>
                    <p className="mt-2 text-4xl font-black text-[#ffb36a]">
                      ฿{booking.finalAmount.toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href="/booking/payment"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#e97732] px-5 py-4 text-sm font-black text-white transition hover:bg-[#ff8b3d]"
                  >
                    <CreditCard size={18} />
                    ไปหน้าชำระเงิน
                  </Link>

                  <Link
                    href="/"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#f7f1e7] px-5 py-4 text-sm font-black text-[#1f3d2b]"
                  >
                    <Home size={18} />
                    กลับหน้าแรก
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "dark" | "green" | "orange";
}) {
  const colorClass = {
    dark: "text-[#1f3d2b]",
    green: "text-green-600",
    orange: "text-[#e97732]",
  }[color];

  return (
    <div className="rounded-[28px] border border-slate-100 bg-[#fff8ec] p-5 text-center">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${colorClass}`}>
        {icon}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-400">{label}</p>
      <p className={`mt-2 text-xl font-black ${colorClass}`}>{value}</p>
    </div>
  );
}

function ReferenceBox({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-[#fff8ec] p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 break-all text-2xl font-black text-[#1f3d2b]">
        {value}
      </p>
      <button
        onClick={onCopy}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-black text-[#e97732]"
      >
        <Copy size={15} />
        {copied ? "คัดลอกแล้ว" : "คัดลอก"}
      </button>
    </div>
  );
}

function PanelHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8faf9] to-white px-5 py-4">
      <h2 className="flex items-center gap-2 text-2xl font-black text-[#1f3d2b]">
        <span className="text-[#e97732]">{icon}</span>
        {title}
      </h2>
    </div>
  );
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="grid grid-cols-[170px_1fr] text-sm md:text-base">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <div className="border-b border-white bg-slate-50 px-4 py-3 text-right font-black text-slate-500">
            {label}
          </div>
          <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-700">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  if (danger) {
    return (
      <>
        <div className="bg-red-600 px-4 py-4 text-right font-black text-white">
          {label}
        </div>
        <div className="px-4 py-4 text-right font-black text-red-600">
          {value}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-slate-50 px-4 py-4 text-right font-black text-slate-500">
        {label}
      </div>
      <div className="px-4 py-4 text-right font-black text-slate-700">
        {value}
      </div>
    </>
  );
}

function SmallSummaryBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 text-center">
      <p className="text-xs font-bold text-white/50">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function DetailBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-[28px] bg-slate-50 p-4">
      <h3 className="mb-4 border-l-4 border-[#e97732] pl-3 text-xl font-black text-[#1f3d2b]">
        {title}
      </h3>
      <div className="rounded-2xl bg-white p-4">{children}</div>
    </section>
  );
}

function MiniDetail({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p
        className={`mt-2 text-sm font-black ${
          danger ? "text-red-600" : "text-[#1f3d2b]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 font-black text-[#1f3d2b]">{value}</p>
    </div>
  );
}
