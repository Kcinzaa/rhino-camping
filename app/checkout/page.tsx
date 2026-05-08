"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

type CartItem = {
  cartId: string;
  roomTypeId: string;
  roomName: string;
  roomSlug: string;
  quantity: number;

  // จำนวนต่อ 1 ห้อง
  adults: number;
  children: number;

  // จำนวนรวมทุกห้องของรายการนั้น
  totalGuests: number;

  nights: number;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  coverImage: string;
};

type CheckoutCart = {
  checkIn?: string;
  checkOut?: string;
  nights: number;
  items: CartItem[];
  total: number;
  savedAt: string;
  groupBenefit?: GroupBenefit;
};

type PaymentMethod = "BANK_TRANSFER";

type GuestForm = {
  roomCartId: string;
  guestName: string;
  useBookerInfo: boolean;
  nationality: string;
  note: string;
  totalGuests: number;
};

type LineProfile = {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  role?: string;
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

type DatabaseBookingRow = {
  cart_data?: CheckoutCart;
};

type CreateBookingApiResponse = {
  message?: string;
  booking?: DatabaseBookingRow;
  error?: string;
  details?: string;
  hint?: string;
  code?: string;
};

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  ink: "#101010",
  black: "#111111",
  orange: "#f97316",
  cream: "#fff7ed",
  line: "#eadfce",
  muted: "#64748b",
  green: "#16a34a",
  red: "#ef4444",
};

const RHINO_POLICY = `ระเบียบการเข้าพัก Rhino Camp

1) ห้องพัก 1 ห้องพักได้ 2 ท่าน (หากท่านประสงค์จะพักเกิน 2 ท่าน กรุณาแจ้งพนักงาน)

2) ห้ามสูบบุหรี่ในที่พัก หากฝ่าฝืนปรับ 2,000 บาท

3) กรุณาสวมใส่ริสแบนด์ตลอดการเข้าพักใน Camp (หากไม่สวมใส่ริสแบนด์จะไม่สามารถเข้าร่วมรับประทานบุฟเฟ่ต์กับทาง Camp ได้)

4) ห้ามนำอาหารบุฟเฟ่ต์ออกนอกลานทานอาหาร

5) อาหารมีเติมตลอด กรุณาตักแต่พอทาน

* หากทานไม่หมด ทาง Rhino Camp จะมีค่าปรับตามเงื่อนไขของทาง Camp กำหนด

เวลาบุฟเฟต์
(เย็น) 18:00-21:00 น.
(เช้า) 7:00-10:00 น.

6) กรุณาลดใช้เสียงดังหลัง 23:00 น. (เพื่อไม่ให้เป็นการรบกวนผู้เข้าพักท่านอื่น)

7) กรณีมีของชำรุด เสียหาย หรือสูญหาย ทาง Rhino Camp จะมีค่าปรับตามเงื่อนไขของทาง Camp กำหนด

8) เช็คเอาท์ก่อนเวลา 12:00 น. พร้อมนำกระติก (แก้วน้ำและที่คีบน้ำแข็ง) มาคืนที่จุดบริการด้วยนะคะ

*** ขอบพระคุณลูกค้าที่ให้ความร่วมมือกับทาง Rhino Camp ค่ะ ***`;

export default function CheckoutPage() {
  const router = useRouter();

  const [cart, setCart] = useState<CheckoutCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  // กรอกผู้เข้าพักครั้งเดียว
  const [guestName, setGuestName] = useState("");
  const [useBookerInfo, setUseBookerInfo] = useState(false);
  const [nationality, setNationality] = useState("ไทย");
  const [guestNote, setGuestNote] = useState("");

  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");

  useEffect(() => {
    const raw = localStorage.getItem("camp_booking_cart");

    if (!raw) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CheckoutCart;

      // กันข้อมูลเก่าที่ totalGuests ยังไม่ได้คูณ quantity
      const fixedCart: CheckoutCart = {
        ...parsed,
        items: parsed.items.map((item) => ({
          ...item,
          totalGuests: getItemTotalGuests(item),
        })),
      };

      setCart(fixedCart);
    } catch (error) {
      console.error("READ_CART_ERROR", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (useBookerInfo) {
      setGuestName(customerName);
    }
  }, [customerName, useBookerInfo]);

  const totalRooms = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalAdults = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + item.adults * item.quantity;
    }, 0);
  }, [cart]);

  const totalChildren = useMemo(() => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      return sum + item.children * item.quantity;
    }, 0);
  }, [cart]);

  const totalGuests = totalAdults + totalChildren;
  const finalAmount = cart?.total || 0;
  const groupBenefit = getGroupBenefits(totalAdults);

  function createBookingCode() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);

    return `RC${yyyy}${mm}${dd}${random}`;
  }

  function generatePaymentReference() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    const random = Math.floor(100 + Math.random() * 900);

    return `TMP${yyyy}${mm}${dd}${hh}${mi}${ss}${random}`;
  }

  function generatePinCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function getLineProfile(): Required<LineProfile> {
    try {
      const raw =
        localStorage.getItem("rhino_line_profile") ||
        localStorage.getItem("camp_line_profile");

      if (!raw) {
        return {
          userId: "demo-line-user-001",
          displayName: "ผู้ใช้ LINE",
          pictureUrl: "",
          role: "USER",
        };
      }

      const parsed = JSON.parse(raw) as LineProfile;

      return {
        userId: parsed.userId || "demo-line-user-001",
        displayName: parsed.displayName || "ผู้ใช้ LINE",
        pictureUrl: parsed.pictureUrl || "",
        role: parsed.role || "USER",
      };
    } catch {
      return {
        userId: "demo-line-user-001",
        displayName: "ผู้ใช้ LINE",
        pictureUrl: "",
        role: "USER",
      };
    }
  }

  function formatPaymentExpireText(date: Date) {
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  async function sendBookingEmail({
    email,
    customerName,
    bookingCode,
    paymentReference,
    pinCode,
    expireAt,
    amount,
    groupBenefitTitle,
  }: {
    email: string;
    customerName: string;
    bookingCode: string;
    paymentReference: string;
    pinCode: string;
    expireAt: Date;
    amount: number;
    groupBenefitTitle?: string;
  }) {
    if (!email.trim()) return;

    try {
      await fetch("/api/send-booking-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          customerName,
          bookingCode,
          paymentReference,
          pinCode,
          expireText: formatPaymentExpireText(expireAt),
          amount,
          groupBenefitTitle,
        }),
      });
    } catch (error) {
      console.error("SEND_EMAIL_CLIENT_ERROR", error);
    }
  }

  function validateBeforeSubmit() {
    if (!cart) return false;

    if (!customerName.trim()) {
      alert("กรุณากรอกชื่อ-นามสกุลผู้จอง");
      return false;
    }

    if (!customerPhone.trim()) {
      alert("กรุณากรอกเบอร์โทร");
      return false;
    }

    if (!customerEmail.trim()) {
      alert("กรุณากรอกอีเมลสำหรับรับข้อมูลยืนยันการจอง");
      return false;
    }

    if (!guestName.trim()) {
      alert("กรุณากรอกชื่อผู้เข้าพัก หรือเลือกใช้ข้อมูลผู้จอง");
      return false;
    }

    if (!acceptedPolicy) {
      alert("กรุณายอมรับเงื่อนไขของที่พัก");
      return false;
    }

    return true;
  }

  function saveBookingToUserList(bookingPayload: unknown) {
    try {
      const oldBookingsRaw = localStorage.getItem("camp_user_bookings");
      const oldBookings = oldBookingsRaw ? JSON.parse(oldBookingsRaw) : [];

      localStorage.setItem(
        "camp_user_bookings",
        JSON.stringify([bookingPayload, ...oldBookings])
      );
    } catch (error) {
      console.error("SAVE_USER_BOOKINGS_ERROR", error);
      localStorage.setItem("camp_user_bookings", JSON.stringify([bookingPayload]));
    }
  }

  async function createBookingInDatabase(bookingPayload: unknown) {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    let result: CreateBookingApiResponse = {};

    try {
      result = (await response.json()) as CreateBookingApiResponse;
    } catch {
      result = {};
    }

    if (!response.ok) {
      console.error("CREATE_BOOKING_API_RESPONSE", result);

      throw new Error(
        [result.message, result.error, result.details, result.hint]
          .filter(Boolean)
          .join(" | ") || "บันทึกการจองลงฐานข้อมูลไม่สำเร็จ"
      );
    }

    return result;
  }

  async function handleSubmit() {
    if (!cart) return;
    if (!validateBeforeSubmit()) return;

    setSubmitting(true);

    try {
      const lineProfile = getLineProfile();
      const bookingCode = createBookingCode();
      const paymentReference = generatePaymentReference();
      const pinCode = generatePinCode();
      const expire = new Date(Date.now() + 60 * 60 * 1000);

      const guestForm: GuestForm = {
        roomCartId: "ALL_ROOMS",
        guestName,
        useBookerInfo,
        nationality,
        note: guestNote,
        totalGuests,
      };

      const fixedCart: CheckoutCart = {
        ...cart,
        items: cart.items.map((item) => ({
          ...item,
          totalGuests: getItemTotalGuests(item),
        })),
      };

      const bookingPayload = {
        bookingCode,
        lineUserId: lineProfile.userId,
        lineProfile: {
          userId: lineProfile.userId,
          displayName: lineProfile.displayName,
          pictureUrl: lineProfile.pictureUrl,
          role: lineProfile.role,
        },
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          contact: customerContact,
        },

        // กรอกครั้งเดียว แต่ยังส่งเป็น array เพื่อให้ API เดิมรับได้
        guests: [guestForm],

        groupBenefit,

        policies: {
          accepted: acceptedPolicy,
          acceptedAt: new Date().toISOString(),
        },
        payment: {
          method: paymentMethod,
          reference: "",
          slipFileName: "",
          paymentReference,
          pinCode,
          expireAt: expire.toISOString(),
          status: "WAITING_PAYMENT",
        },
        cart: fixedCart,
        summary: {
          totalRooms,
          totalAdults,
          totalChildren,
          totalGuests,
          groupBenefit,
        },
        finalAmount,
        createdAt: new Date().toISOString(),
        status: "PENDING_PAYMENT",
      };

      const result = await createBookingInDatabase(bookingPayload);
      const assignedBenefit =
        result.booking?.cart_data?.groupBenefit || groupBenefit;
      const savedPayload = {
        ...bookingPayload,
        groupBenefit: assignedBenefit,
        cart: {
          ...fixedCart,
          groupBenefit: assignedBenefit,
        },
        summary: {
          ...bookingPayload.summary,
          groupBenefit: assignedBenefit,
        },
      };

      localStorage.setItem("camp_latest_booking", JSON.stringify(savedPayload));
      saveBookingToUserList(savedPayload);
      localStorage.removeItem("camp_booking_cart");

      await sendBookingEmail({
        email: customerEmail,
        customerName,
        bookingCode,
        paymentReference,
        pinCode,
        expireAt: expire,
        amount: finalAmount,
        groupBenefitTitle:
          assignedBenefit.level !== "NONE" &&
          (!("assigned" in assignedBenefit) || assignedBenefit.assigned !== false)
            ? assignedBenefit.title
            : undefined,
      });

      router.push("/manage");
    } catch (error) {
      console.error("CREATE_BOOKING_ERROR", error);

      const message =
        error instanceof Error
          ? error.message
          : "บันทึกการจองลงฐานข้อมูลไม่สำเร็จ";

      alert(message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen" style={{ background: UI.page, color: UI.ink }}>
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
          <div
            className="rounded-[34px] border p-10 text-center shadow-2xl"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
            }}
          >
            <Loader2 className="mx-auto animate-spin" color={UI.orange} size={46} />
            <p className="mt-4 text-2xl font-black">กำลังโหลดข้อมูลการจอง</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
              กรุณารอสักครู่
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen" style={{ background: UI.page, color: UI.ink }}>
        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div
            className="mx-auto max-w-2xl rounded-[38px] border p-8 text-center shadow-2xl"
            style={{
              background: UI.paper,
              borderColor: UI.line,
              boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
            }}
          >
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white"
              style={{ background: UI.orange }}
            >
              <Info size={42} />
            </div>

            <h1 className="mt-5 text-4xl font-black">ไม่มีรายการในรถเข็น</h1>

            <p
              className="mt-3 text-sm font-semibold leading-7"
              style={{ color: UI.muted }}
            >
              กรุณากลับไปเลือกที่พักก่อน แล้วค่อยเข้าหน้ากรอกข้อมูลการจอง
            </p>

            <Link
              href="/booking"
              className="mt-7 inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white"
              style={{ background: UI.black }}
            >
              <ArrowLeft size={18} />
          กลับไปเลือกที่พัก
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{ background: UI.page, color: UI.ink }}
    >
      <CheckoutHero
        totalRooms={totalRooms}
        totalAdults={totalAdults}
        totalChildren={totalChildren}
        totalGuests={totalGuests}
        nights={cart.nights}
        finalAmount={finalAmount}
        groupBenefit={groupBenefit}
      />

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 md:px-6">
        <div className="grid gap-7">
          <OrderStrip
            cart={cart}
            totalRooms={totalRooms}
            totalAdults={totalAdults}
            totalChildren={totalChildren}
            totalGuests={totalGuests}
            finalAmount={finalAmount}
            groupBenefit={groupBenefit}
          />

          <CheckoutSection
            number={1}
            title="ข้อมูลผู้จอง"
            description="ข้อมูลนี้ใช้สำหรับติดต่อกลับและส่งรายละเอียดการชำระเงิน"
            icon={<UserRound size={24} />}
          >
            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="ชื่อ-นามสกุล"
                  required
                  value={customerName}
                  onChange={setCustomerName}
                  placeholder="กรอกชื่อ-นามสกุล"
                  icon={<UserRound size={19} />}
                />

                <InputField
                  label="เบอร์โทร"
                  required
                  value={customerPhone}
                  onChange={setCustomerPhone}
                  placeholder="เช่น 0900000000"
                  icon={<Phone size={19} />}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InputField
                  label="อีเมล"
                  required
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  placeholder="example@email.com"
                  icon={<Mail size={19} />}
                />

                <InputField
                  label="ช่องทางติดต่อเพิ่มเติม"
                  value={customerContact}
                  onChange={setCustomerContact}
                  placeholder="เช่น LINE ID, Facebook"
                  icon={<MessageCircle size={19} />}
                />
              </div>
            </div>
          </CheckoutSection>

          <CheckoutSection
            number={2}
            title="ข้อมูลผู้เข้าพัก"
            description="กรอกครั้งเดียว ใช้กับรายการจองทั้งหมด"
            icon={<UsersRound size={24} />}
          >
            <div className="grid gap-5">
              <div
                className="rounded-[34px] border p-5"
                style={{
                  background:
                    "linear-gradient(135deg, #fff7ed 0%, #ffffff 58%, #ecfdf5 100%)",
                  borderColor: UI.line,
                }}
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
                  <div>
                    <p
                      className="text-xs font-black uppercase tracking-[0.22em]"
                      style={{ color: UI.orange }}
                    >
                      Guest Summary
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      ผู้เข้าพักรวม {totalGuests} คน
                    </h3>

                    <p
                      className="mt-2 text-sm font-semibold leading-7"
                      style={{ color: UI.muted }}
                    >
                      ผู้ใหญ่ {totalAdults} คน • เด็ก {totalChildren} คน •{" "}
                      {totalRooms} ห้อง
                    </p>
                  </div>

                  <div
                    className="rounded-[28px] p-5"
                    style={{
                      background:
                        groupBenefit.level === "NONE" ? UI.black : UI.green,
                      color: "#ffffff",
                    }}
                  >
                    <p className="text-xs font-black text-white/60">
                      สิทธิ์กลุ่ม
                    </p>
                    <p className="mt-1 text-xl font-black">{groupBenefit.title}</p>
                    <p className="mt-2 text-xs font-semibold text-white/75">
                      {groupBenefit.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="rounded-[34px] border p-5"
                style={{ background: UI.paper, borderColor: UI.line }}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="ชื่อผู้เข้าพักหลัก"
                    required
                    value={guestName}
                    onChange={setGuestName}
                    placeholder="กรอกชื่อผู้เข้าพัก"
                    icon={<UserRound size={19} />}
                  />

                  <div>
                    <p className="mb-2 text-sm font-black">ใช้ข้อมูลผู้จอง</p>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !useBookerInfo;
                        setUseBookerInfo(next);
                        setGuestName(next ? customerName : "");
                      }}
                      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border text-sm font-black transition"
                      style={{
                        background: useBookerInfo ? UI.black : UI.paper,
                        color: useBookerInfo ? "#ffffff" : UI.ink,
                        borderColor: useBookerInfo ? UI.black : UI.line,
                      }}
                    >
                      <CheckCircle2 size={19} />
                      {useBookerInfo ? "ใช้ข้อมูลผู้จองแล้ว" : "ใช้ข้อมูลผู้จอง"}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-1">
                  <SelectField
                    label="สัญชาติ"
                    value={nationality}
                    onChange={setNationality}
                    options={["ไทย", "ต่างชาติ"]}
                  />

                </div>

                <div className="mt-5">
                  <p className="mb-2 text-sm font-black">หมายเหตุ</p>
                  <textarea
                    value={guestNote}
                    onChange={(event) => setGuestNote(event.target.value)}
                    placeholder="เช่น ขอห้องใกล้กัน / แพ้อาหาร / เดินทางมาช้า"
                    className="min-h-28 w-full resize-none rounded-[24px] border bg-white px-5 py-4 text-sm font-bold outline-none"
                    style={{ borderColor: UI.line }}
                  />
                </div>
              </div>
            </div>
          </CheckoutSection>

          <CheckoutSection
            number={3}
            title="เงื่อนไขที่พัก"
            description="อ่านเงื่อนไขสำคัญก่อนยืนยันรายการ"
            icon={<ShieldCheck size={24} />}
          >
            <div
              className="rounded-[30px] border p-5"
              style={{ background: "#f8fafc", borderColor: "#e2e8f0" }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ background: UI.orange }}
                >
                  <AlertTriangle size={23} />
                </div>

                <div>
                  <h3 className="text-xl font-black">นโยบาย Rhino Camp</h3>
                  <p className="text-sm font-semibold" style={{ color: UI.muted }}>
                    ห้องจะถูกถือไว้ 1 ชั่วโมงหลังสร้างรายการจอง
                  </p>
                </div>
              </div>

              <textarea
                value={RHINO_POLICY}
                readOnly
                className="h-56 w-full resize-none rounded-[26px] border bg-white p-5 text-sm font-semibold leading-8 outline-none md:text-base"
                style={{ borderColor: UI.line, color: UI.ink }}
              />

              <label
                className="mt-5 flex cursor-pointer items-start gap-4 rounded-[26px] border-2 border-dashed p-5"
                style={{
                  background: acceptedPolicy ? "#ecfdf5" : UI.cream,
                  borderColor: acceptedPolicy ? "#86efac" : "#fed7aa",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedPolicy}
                  onChange={(event) => setAcceptedPolicy(event.target.checked)}
                  className="mt-1 h-5 w-5 accent-orange-500"
                />

                <span className="font-black">
                  ยอมรับเงื่อนไขของที่พัก และยืนยันว่าข้อมูลการจองถูกต้อง
                </span>
              </label>
            </div>
          </CheckoutSection>

          <CheckoutSection
            number={4}
            title="ยืนยันการจอง"
            description="ระบบจะบันทึกการจองลงฐานข้อมูลและสร้างเลขอ้างอิงสำหรับแจ้งชำระเงิน"
            icon={<WalletCards size={24} />}
          >
            <div className="grid gap-5">
              <label
                className="flex cursor-pointer items-center justify-between gap-4 rounded-[30px] border p-5"
                style={{
                  background:
                    paymentMethod === "BANK_TRANSFER" ? UI.cream : UI.paper,
                  borderColor:
                    paymentMethod === "BANK_TRANSFER" ? "#fed7aa" : UI.line,
                }}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    checked={paymentMethod === "BANK_TRANSFER"}
                    onChange={() => setPaymentMethod("BANK_TRANSFER")}
                    className="h-5 w-5 accent-orange-500"
                  />

                  <div>
                    <p className="text-xl font-black">โอนผ่านธนาคาร / พร้อมเพย์</p>
                    <p
                      className="mt-1 text-sm font-semibold"
                      style={{ color: UI.muted }}
                    >
                      หลังยืนยัน ระบบจะพาไปหน้าการจองของฉันเพื่อแจ้งชำระเงิน
                    </p>
                  </div>
                </div>

                <LockKeyhole className="hidden md:block" color={UI.orange} />
              </label>

              <div
                className="rounded-[30px] border p-6"
                style={{
                  background: UI.black,
                  borderColor: UI.black,
                  color: "white",
                }}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-300">
                      Total Payment
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/55">
                      ยอดชำระรวม
                    </p>
                    <p className="break-words text-4xl font-black sm:text-5xl" style={{ color: UI.orange }}>
                      ฿{finalAmount.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 text-sm font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: UI.orange }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        กำลังบันทึกลงฐานข้อมูล
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={20} />
                        ยืนยันการจอง
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CheckoutSection>
        </div>
      </section>
    </main>
  );
}

function CheckoutHero({
  totalRooms,
  totalAdults,
  totalChildren,
  totalGuests,
  nights,
  finalAmount,
  groupBenefit,
}: {
  totalRooms: number;
  totalAdults: number;
  totalChildren: number;
  totalGuests: number;
  nights: number;
  finalAmount: number;
  groupBenefit: ReturnType<typeof getGroupBenefits>;
}) {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{
        background:
          "radial-gradient(circle at top left, #fff7ed 0%, #f6efe5 44%, #efe4d5 100%)",
        borderColor: UI.line,
      }}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: UI.orange }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/booking"
          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black"
          style={{
            background: UI.paper,
            borderColor: UI.line,
            color: UI.ink,
          }}
        >
          <ArrowLeft size={18} />
          กลับไปเลือกที่พัก
        </Link>

        <div
          className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
          style={{
            background: UI.paper,
            color: UI.orange,
            border: "1px solid " + UI.line,
          }}
        >
          <Sparkles size={16} />
          Checkout
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_390px] lg:items-end">
          <div className="fade-up">
            <h1 className="max-w-4xl text-[2.25rem] font-black leading-[1.08] sm:text-5xl md:text-6xl">
              กรอกข้อมูลการจอง
              <span style={{ color: UI.orange }}> ครั้งเดียว</span>
            </h1>

            <p
              className="mt-5 max-w-2xl text-sm font-semibold leading-7 md:text-base"
              style={{ color: UI.muted }}
            >
              ระบบรวมจำนวนคนจากทุกห้องให้อัตโนมัติ และแสดงสิทธิ์กลุ่มตามจำนวนผู้ใหญ่
            </p>
          </div>

          <div
            className="rounded-[32px] border p-5"
            style={{
              background: "rgba(255,255,255,0.78)",
              borderColor: UI.line,
              backdropFilter: "blur(18px)",
            }}
          >
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <HeroSummaryBox label="คืน" value={nights} />
              <HeroSummaryBox label="ห้อง" value={totalRooms} />
              <HeroSummaryBox label="คน" value={totalGuests} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <HeroSummaryBox label="ผู้ใหญ่" value={totalAdults} />
              <HeroSummaryBox label="เด็ก" value={totalChildren} />
            </div>

            <div
              className="mt-4 rounded-[26px] p-5"
              style={{ background: UI.black, color: "white" }}
            >
              <p className="text-sm font-semibold text-white/55">ยอดรวม</p>
              <p className="mt-1 text-4xl font-black" style={{ color: UI.orange }}>
                ฿{finalAmount.toLocaleString()}
              </p>
            </div>

            <div
              className="mt-4 rounded-[26px] p-4"
              style={{
                background:
                  groupBenefit.level === "NONE" ? UI.cream : "#ecfdf5",
                border: "1px solid " +
                  (groupBenefit.level === "NONE" ? UI.line : "#86efac"),
              }}
            >
              <p
                className="text-sm font-black"
                style={{
                  color: groupBenefit.level === "NONE" ? UI.orange : UI.green,
                }}
              >
                {groupBenefit.title}
              </p>
              <p
                className="mt-1 text-xs font-semibold leading-5"
                style={{ color: UI.muted }}
              >
                {groupBenefit.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSummaryBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl border p-4 text-center"
      style={{ background: UI.paper, borderColor: UI.line }}
    >
      <p className="text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function OrderStrip({
  cart,
  totalRooms,
  totalAdults,
  totalChildren,
  totalGuests,
  finalAmount,
  groupBenefit,
}: {
  cart: CheckoutCart;
  totalRooms: number;
  totalAdults: number;
  totalChildren: number;
  totalGuests: number;
  finalAmount: number;
  groupBenefit: ReturnType<typeof getGroupBenefits>;
}) {
  return (
    <section
      className="overflow-hidden rounded-[34px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
      }}
    >
      <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.24em]"
            style={{ color: UI.orange }}
          >
            Selected Rooms
          </p>

          <h2 className="mt-2 text-3xl font-black">รายการที่เลือก</h2>

          <p
            className="mt-2 text-sm font-black"
            style={{ color: UI.muted }}
          >
            {cart.nights} คืน • {totalRooms} ห้อง • ผู้ใหญ่ {totalAdults} • เด็ก{" "}
            {totalChildren} • รวม {totalGuests} คน
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-sm font-black" style={{ color: UI.muted }}>
            ยอดรวม
          </p>
          <p className="break-words text-4xl font-black sm:text-5xl" style={{ color: UI.orange }}>
            ฿{finalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <div
        className="border-t p-5"
        style={{
          borderColor: UI.line,
          background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%)",
        }}
      >
        <div className="grid gap-4">
          {cart.items.map((item, index) => {
            const itemAdults = item.adults * item.quantity;
            const itemChildren = item.children * item.quantity;
            const itemGuests = itemAdults + itemChildren;

            return (
              <div
                key={item.cartId}
                className="grid gap-4 rounded-[28px] border bg-white p-4 md:grid-cols-[110px_1fr_auto] md:items-center"
                style={{ borderColor: UI.line }}
              >
                <div className="relative h-28 overflow-hidden rounded-[22px] bg-slate-200">
                  <Image
                    src={item.coverImage || "/images/tent-1.jpg"}
                    alt={item.roomName}
                    fill
                    sizes="110px"
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

                  <h3 className="mt-1 text-2xl font-black">{item.roomName}</h3>

                  <p
                    className="mt-2 text-sm font-semibold"
                    style={{ color: UI.muted }}
                  >
                    {item.quantity} ห้อง • ผู้ใหญ่ {itemAdults} • เด็ก{" "}
                    {itemChildren} • รวม {itemGuests} คน
                  </p>
                </div>

                <div
                  className="rounded-[24px] p-4 text-left md:min-w-[150px] md:text-right"
                  style={{ background: UI.black, color: "#ffffff" }}
                >
                  <p className="text-xs font-semibold text-white/55">ยอดรายการ</p>
                  <p className="text-2xl font-black" style={{ color: UI.orange }}>
                    ฿{item.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-5 rounded-[30px] border p-5"
          style={{
            background: groupBenefit.level === "NONE" ? UI.cream : "#ecfdf5",
            borderColor: groupBenefit.level === "NONE" ? UI.line : "#86efac",
          }}
        >
          <div className="flex gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{
                background:
                  groupBenefit.level === "NONE" ? UI.black : UI.green,
              }}
            >
              <Gift size={24} />
            </div>

            <div>
              <p className="text-xl font-black">{groupBenefit.title}</p>
              <p
                className="mt-1 text-sm font-black"
                style={{
                  color:
                    groupBenefit.level === "NONE" ? UI.orange : UI.green,
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckoutSection({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-[34px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 20px 60px rgba(15,23,42,0.07)",
      }}
    >
      <div
        className="border-b p-6"
        style={{
          background:
            "linear-gradient(135deg, #fff7ed 0%, #ffffff 60%, #fff3e8 100%)",
          borderColor: UI.line,
        }}
      >
        <div className="flex items-start gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-white"
            style={{ background: UI.black }}
          >
            {icon}
          </div>

          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.24em]"
              style={{ color: UI.orange }}
            >
              Step {number}
            </p>
            <h2 className="mt-1 text-3xl font-black">{title}</h2>
            <p
              className="mt-2 text-sm font-semibold leading-6"
              style={{ color: UI.muted }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6">{children}</div>
    </section>
  );
}

function InputField({
  label,
  required,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-sm font-black">
        {label} {required && <span className="text-red-500">*</span>}
      </p>

      <div
        className="flex min-h-14 items-center gap-3 rounded-2xl border px-5"
        style={{ background: UI.paper, borderColor: UI.line }}
      >
        <span style={{ color: UI.orange }}>{icon}</span>

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-sm font-black">{label}</p>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-14 w-full rounded-2xl border bg-white px-5 text-sm font-bold outline-none"
        style={{ borderColor: UI.line }}
      >
        {placeholder && <option value="">{placeholder}</option>}

        {options
          .filter((item) => item !== "")
          .map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
      </select>
    </label>
  );
}

function getItemTotalGuests(item: CartItem) {
  return (Number(item.adults || 0) + Number(item.children || 0)) * Number(item.quantity || 1);
}

function getGroupBenefits(adults: number) {
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
