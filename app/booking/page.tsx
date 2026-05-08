"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Eye,
  Flame,
  Gift,
  Loader2,
  Minus,
  PawPrint,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trash2,
  UsersRound,
  Utensils,
  X,
} from "lucide-react";

type RoomRate = {
  id: string;
  day_type: "WEEKDAY" | "WEEKEND";
  price_per_person: number;
};

type RoomUnit = {
  id: string;
  name: string;
  status: string;
};

type RoomType = {
  id: string;
  name: string;
  slug: string;
  category: string;
  capacity: number;
  unit_label: string;
  description: string | null;
  cover_image: string | null;
  gallery_images?: string[] | string | null;
  is_pet_allowed: boolean;
  is_active: boolean;
  room_rates: RoomRate[];
  room_units: RoomUnit[];
  available_rooms?: number;
  availableRooms?: number;
  total_units?: number;
  sell_on_rhino?: boolean;
};

type PackageInclude = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  image_url?: string | null;
  sort_order: number;
};

type Promotion = {
  id: string;
  title: string;
  min_guests: number;
  description: string;
};

type ResortPolicy = {
  id: string;
  title: string;
  description: string;
  type: string;
};

type BookingRange = {
  id: string;
  check_in?: string | null;
  check_out?: string | null;
  booking_status?: string | null;
  payment_status?: string | null;
  cart_data?: {
    checkIn?: string;
    checkOut?: string;
    groupBenefit?: {
      level?: "NONE" | "KARAOKE" | "PARTY";
      assigned?: boolean;
    } | null;
    items?: {
      roomTypeId?: string;
      room_type_id?: string;
      roomSlug?: string;
      room_slug?: string;
      slug?: string;
      quantity?: number;
    }[];
  } | null;
  booking_rooms?: {
    room_type_id: string;
    quantity: number;
  }[];
};

type CalendarDayAvailability = {
  date: string;
  available: number;
  total: number;
};

type DisplayRoom = RoomType & {
  available: number;
  totalUnits: number;
  weekdayPrice: number;
  weekendPrice: number;
  startingPrice: number;
  totalForOneUnit: number;
};

type CartItem = {
  cartId: string;
  roomTypeId: string;
  roomName: string;
  roomSlug: string;
  quantity: number;
  adults: number;
  children: number;
  totalGuests: number;
  nights: number;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  coverImage: string;
};

type PromoAvailability = {
  karaoke: number;
  party: number;
  usedKaraoke: number;
  usedParty: number;
};

type PocketRoom = DisplayRoom | null;
type DetailRoom = DisplayRoom | null;

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  ink: "#101010",
  black: "#111111",
  orange: "#f97316",
  orangeSoft: "#fff3e8",
  cream: "#fff7ed",
  line: "#eadfce",
  muted: "#64748b",
  green: "#16a34a",
  red: "#ef4444",
  yellow: "#f59e0b",
};

const THAI_MONTHS = [
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

const FULL_THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const WEEKDAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingPageFallback />}>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: UI.page }}>
      <div className="text-center">
        <Loader2 className="mx-auto animate-spin" size={44} color={UI.orange} />
        <p className="mt-4 text-xl font-black" style={{ color: UI.black }}>
          กำลังโหลดข้อมูลการจอง
        </p>
      </div>
    </div>
  );
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const [checkIn, setCheckIn] = useState(() => getTodayDateInputValue());
  const [nights, setNights] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [queryRoomType, setQueryRoomType] = useState("");

  const [rooms, setRooms] = useState<DisplayRoom[]>([]);
  const [packageIncludes, setPackageIncludes] = useState<PackageInclude[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [policies, setPolicies] = useState<ResortPolicy[]>([]);
  const [bookingRanges, setBookingRanges] = useState<BookingRange[]>([]);
  const [promoAvailability, setPromoAvailability] = useState<PromoAvailability>({
    karaoke: 2,
    party: 2,
    usedKaraoke: 0,
    usedParty: 0,
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [pocketRoom, setPocketRoom] = useState<PocketRoom>(null);
  const [pocketQuantity, setPocketQuantity] = useState(1);
  const [pocketAdults, setPocketAdults] = useState(2);
  const [pocketChildren, setPocketChildren] = useState(0);

  const [detailRoom, setDetailRoom] = useState<DetailRoom>(null);

  const checkOut = useMemo(() => addDays(checkIn, nights), [checkIn, nights]);

  useEffect(() => {
    const queryCheckIn = searchParams.get("checkIn");
    const queryNights = Number(searchParams.get("nights"));

    if (queryCheckIn && isValidDateInputValue(queryCheckIn)) {
      setCheckIn(queryCheckIn);
    }

    if (Number.isFinite(queryNights) && queryNights > 0) {
      setNights(Math.min(Math.max(Math.floor(queryNights), 1), 30));
    }

    setQueryRoomType(searchParams.get("roomType") || "");
  }, [searchParams]);

  useEffect(() => {
    loadBookingData();
  }, [checkIn, nights]);

  async function loadBookingData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [roomResponse, includeResult, promotionResult, policyResult, bookingResult] =
        await Promise.all([
        fetch(`/api/rooms?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`, {
          cache: "no-store",
        }),
        supabase
          .from("package_includes")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        supabase
          .from("promotions")
          .select("*")
          .eq("is_active", true)
          .order("min_guests", { ascending: true }),

        supabase
          .from("resort_policies")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true }),

        supabase
          .from("bookings")
          .select(
            `
              id,
              check_in,
              check_out,
              booking_status,
              payment_status,
              cart_data
            `
          )
          .neq("booking_status", "CANCELLED"),
      ]);
      const promoResponse = await fetch(
        `/api/group-benefits/availability?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`,
        { cache: "no-store" }
      );

      if (!roomResponse.ok) {
        const roomError = await roomResponse.json().catch(() => ({}));
        throw new Error(roomError.message || "Load rooms failed");
      }

      if (!promoResponse.ok) {
        const promoError = await promoResponse.json().catch(() => ({}));
        throw new Error(promoError.message || "Load group benefits failed");
      }

      if (includeResult.error) throw includeResult.error;
      if (promotionResult.error) throw promotionResult.error;
      if (policyResult.error) throw policyResult.error;
      if (bookingResult.error) throw bookingResult.error;

      const roomJson = await roomResponse.json();
      const promoJson = await promoResponse.json();
      const allBookings = (bookingResult.data || []) as BookingRange[];
      setBookingRanges(allBookings);
      setPromoAvailability({
        karaoke: Number(promoJson.remaining?.karaoke ?? 2),
        party: Number(promoJson.remaining?.party ?? 2),
        usedKaraoke: Number(promoJson.used?.karaoke ?? 0),
        usedParty: Number(promoJson.used?.party ?? 0),
      });

      const bookedMap = getBookedMapForRange(
        allBookings,
        checkIn,
        checkOut,
        (roomJson.rooms || []) as RoomType[]
      );

      const mappedRooms = ((roomJson.rooms || []) as RoomType[]).filter(isRhinoRoomVisible).map((room) => {
        const activeUnits = (room.room_units || []).filter(
          (unit) => unit.status === "AVAILABLE"
        );

        const booked = bookedMap.get(room.id) || 0;
        const apiAvailable =
          typeof room.available_rooms === "number"
            ? room.available_rooms
            : typeof room.availableRooms === "number"
              ? room.availableRooms
              : null;
        const available = apiAvailable ?? Math.max(activeUnits.length - booked, 0);

        const weekdayPrice =
          room.room_rates.find((rate) => rate.day_type === "WEEKDAY")
            ?.price_per_person || 0;

        const weekendPrice =
          room.room_rates.find((rate) => rate.day_type === "WEEKEND")
            ?.price_per_person || 0;

        const priceList = [weekdayPrice, weekendPrice].filter(
          (price) => price > 0
        );

        const startingPrice = priceList.length > 0 ? Math.min(...priceList) : 0;

        const totalForOneUnit = calculateRoomTotal({
          room,
          checkIn,
          nights,
          adults: room.capacity,
          children: 0,
          quantity: 1,
        });

        return {
          ...room,
          available,
          totalUnits: activeUnits.length,
          weekdayPrice,
          weekendPrice,
          startingPrice,
          totalForOneUnit,
        };
      });

      setRooms(mappedRooms);
      setPackageIncludes((includeResult.data || []) as PackageInclude[]);
      setPromotions((promotionResult.data || []) as Promotion[]);
      setPolicies((policyResult.data || []) as ResortPolicy[]);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Supabase URL, ANON KEY, RLS Policy และชื่อตาราง"
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();

    rooms.forEach((room) => {
      const old = map.get(room.category);

      map.set(room.category, {
        id: room.category,
        label: getCategoryLabel(room.category),
        count: (old?.count || 0) + room.available,
      });
    });

    return Array.from(map.values());
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let nextRooms = rooms;

    if (selectedCategories.length > 0) {
      nextRooms = nextRooms.filter((room) =>
        selectedCategories.includes(room.category)
      );
    }

    if (queryRoomType && queryRoomType !== "all") {
      nextRooms = nextRooms.filter((room) => isRoomMatchQuery(room, queryRoomType));
    }

    return nextRooms;
  }, [rooms, selectedCategories, queryRoomType]);

  const totalAvailable = useMemo(() => {
    return filteredRooms.reduce((sum, room) => sum + room.available, 0);
  }, [filteredRooms]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [cartItems]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }

      return [...prev, categoryId];
    });
  }

  function openPocket(room: DisplayRoom) {
    setPocketRoom(room);
    setPocketQuantity(1);
    setPocketAdults(room.capacity);
    setPocketChildren(0);
  }

  function closePocket() {
    setPocketRoom(null);
  }

function addPocketToCart() {
  if (!pocketRoom) return;

  if (pocketRoom.available <= 0) {
    alert("ห้องประเภทนี้เต็มแล้ว");
    return;
  }

  if (pocketQuantity > pocketRoom.available) {
    alert(`เหลือห้องว่างเพียง ${pocketRoom.available} ห้อง`);
    return;
  }

  const totalAdults = pocketAdults * pocketQuantity;
  const totalChildren = pocketChildren * pocketQuantity;
  const totalGuests = totalAdults + totalChildren;

  if (totalGuests <= 0) {
    alert("กรุณาเลือกจำนวนผู้เข้าพัก");
    return;
  }

  const totalAmount = calculateRoomTotal({
    room: pocketRoom,
    checkIn,
    nights,
    adults: pocketAdults,
    children: pocketChildren,
    quantity: pocketQuantity,
  });

  const newItem: CartItem = {
    cartId: `${pocketRoom.id}-${Date.now()}`,
    roomTypeId: pocketRoom.id,
    roomName: pocketRoom.name,
    roomSlug: pocketRoom.slug,
    quantity: pocketQuantity,

    // adults / children = จำนวนต่อ 1 ห้อง
    adults: pocketAdults,
    children: pocketChildren,

    // totalGuests = จำนวนคนรวมทุกห้อง
    totalGuests,

    nights,
    checkIn,
    checkOut,
    totalAmount,
    coverImage: getRoomGallery(pocketRoom)[0],
  };

  setCartItems((prev) => [...prev, newItem]);
  setCartOpen(true);
  closePocket();
}

  function removeCartItem(cartId: string) {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  function goCheckout() {
    if (cartItems.length === 0) {
      alert("กรุณาเลือกห้องก่อน");
      return;
    }

    const cartPayload = {
      checkIn,
      checkOut,
      nights,
      items: cartItems,
      total: cartTotal,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("camp_booking_cart", JSON.stringify(cartPayload));
    window.location.href = "/checkout";
  }

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{ background: UI.page, color: UI.ink }}
    >
      <HeroSection
        checkIn={checkIn}
        nights={nights}
        categories={categories}
        selectedCategories={selectedCategories}
        onCheckInChange={setCheckIn}
        onNightsChange={setNights}
        onToggleCategory={toggleCategory}
        onClearCategories={() => setSelectedCategories([])}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 md:px-6">
        <CategoryTabs
          categories={categories}
          selectedCategories={selectedCategories}
          onToggle={toggleCategory}
          onClear={() => setSelectedCategories([])}
        />

        <div className="mt-7 grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<CalendarDays size={24} />}
            label="วันเช็คอิน"
            value={formatDateShort(checkIn)}
          />
          <StatCard
            icon={<Clock size={24} />}
            label="จำนวนคืน"
            value={`${nights} คืน`}
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            label="ห้องว่างรวม"
            value={`${totalAvailable} ห้อง`}
          />
          <StatCard
            icon={<ShieldCheck size={24} />}
            label="ประเภทที่พบ"
            value={`${filteredRooms.length} ประเภท`}
            dark
          />
        </div>

        <InfoStrip
          packageIncludes={packageIncludes}
          promotions={promotions}
          policies={policies}
        />

        {loading && <LoadingBlock />}
        {!loading && errorMessage && <ErrorBlock message={errorMessage} />}
        {!loading && !errorMessage && filteredRooms.length === 0 && <EmptyBlock />}

        {!loading && !errorMessage && filteredRooms.length > 0 && (
          <div className="mt-8 grid gap-8">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                checkIn={checkIn}
                nights={nights}
                bookingRanges={bookingRanges}
                onBook={() => openPocket(room)}
                onDetail={() => setDetailRoom(room)}
              />
            ))}
          </div>
        )}
      </section>

      <FloatingCartButton
        count={cartItems.length}
        total={cartTotal}
        onOpen={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        total={cartTotal}
        bookingRanges={bookingRanges}
        promoAvailability={promoAvailability}
        checkIn={checkIn}
        checkOut={checkOut}
        onClose={() => setCartOpen(false)}
        onRemove={removeCartItem}
        onCheckout={goCheckout}
      />

<PocketModal
  room={pocketRoom}
  checkIn={checkIn}
  nights={nights}
  checkOut={checkOut}
  quantity={pocketQuantity}
  adults={pocketAdults}
  children={pocketChildren}
  onClose={closePocket}
  onQuantityChange={(value) => {
    setPocketQuantity(value);
  }}
  onAdultsChange={setPocketAdults}
  onChildrenChange={setPocketChildren}
  onConfirm={addPocketToCart}
/>

      <RoomDetailModal
        room={detailRoom}
        packageIncludes={packageIncludes}
        promotions={promotions}
        policies={policies}
        onClose={() => setDetailRoom(null)}
      />
    </main>
  );
}

function HeroSection({
  checkIn,
  nights,
  categories,
  selectedCategories,
  onCheckInChange,
  onNightsChange,
  onToggleCategory,
  onClearCategories,
}: {
  checkIn: string;
  nights: number;
  categories: { id: string; label: string; count: number }[];
  selectedCategories: string[];
  onCheckInChange: (value: string) => void;
  onNightsChange: (value: number) => void;
  onToggleCategory: (value: string) => void;
  onClearCategories: () => void;
}) {
  return (
    <section
      className="relative border-b"
      style={{
        background:
          "radial-gradient(circle at top left, #fff7ed 0, #f6efe5 38%, #efe4d5 100%)",
        borderColor: UI.line,
      }}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: UI.orange }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-10 h-60 w-60 rounded-full opacity-20 blur-3xl"
        style={{ background: "#111111" }}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:px-6 md:py-10 lg:grid-cols-[1fr_450px] lg:items-center lg:py-14">
        <div className="fade-up">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
            style={{
              background: UI.paper,
              color: UI.orange,
              border: `1px solid ${UI.line}`,
            }}
          >
            <Sparkles size={16} />
            Rhino Camp Booking
          </div>

          <h1 className="mt-5 max-w-4xl text-[2.35rem] font-black leading-[1.08] sm:text-5xl md:text-6xl">
            เลือกที่พัก
            <span style={{ color: UI.orange }}> เช็กห้องว่าง </span>
            แล้วจองได้ทันที
          </h1>

          <p
            className="mt-5 max-w-2xl text-sm font-semibold leading-7 md:text-base"
            style={{ color: UI.muted }}
          >
            ระบบจองห้องพัก Rhino Camp แสดงราคา ห้องว่าง และแพ็กเกจตามข้อมูลจริงจากฐานข้อมูล
          </p>

          <div className="mt-7 grid max-w-2xl gap-3 min-[420px]:grid-cols-3">
            <MiniHeroBadge label="แพ็กเกจ" value="บุฟเฟ่ต์ 2 มื้อ" />
            <MiniHeroBadge label="เครื่องดื่ม" value="ฟรีตลอดเข้าพัก" />
            <MiniHeroBadge label="ระบบ" value="เช็กห้องว่างทันที" />
          </div>
        </div>

        <SearchPanel
          checkIn={checkIn}
          nights={nights}
          categories={categories}
          selectedCategories={selectedCategories}
          onCheckInChange={onCheckInChange}
          onNightsChange={onNightsChange}
          onToggleCategory={onToggleCategory}
          onClearCategories={onClearCategories}
        />
      </div>
    </section>
  );
}

function MiniHeroBadge({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-3xl border p-4"
      style={{
        background: "rgba(255,255,255,0.7)",
        borderColor: UI.line,
        backdropFilter: "blur(12px)",
      }}
    >
      <p className="text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function SearchPanel({
  checkIn,
  nights,
  categories,
  selectedCategories,
  onCheckInChange,
  onNightsChange,
  onToggleCategory,
  onClearCategories,
}: {
  checkIn: string;
  nights: number;
  categories: { id: string; label: string; count: number }[];
  selectedCategories: string[];
  onCheckInChange: (value: string) => void;
  onNightsChange: (value: number) => void;
  onToggleCategory: (value: string) => void;
  onClearCategories: () => void;
}) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const selectedText =
    selectedCategories.length === 0
      ? `ทุกประเภท (${categories.length})`
      : `เลือกแล้ว ${selectedCategories.length} ประเภท`;

  function openDatePicker() {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  }

  return (
    <div
      className="rounded-[34px] border p-4 shadow-2xl"
      style={{
        background: "rgba(255,255,255,0.78)",
        borderColor: UI.line,
        boxShadow: "0 28px 80px rgba(17,17,17,0.12)",
        backdropFilter: "blur(18px)",
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ background: UI.black }}
        >
          <Search size={21} />
        </div>

        <div>
          <p className="text-lg font-black">ค้นหาห้องพัก</p>
          <p className="text-xs font-bold" style={{ color: UI.muted }}>
            เลือกวัน จำนวนคืน และประเภทห้อง
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <button
          type="button"
          onClick={openDatePicker}
          className="relative w-full rounded-3xl border p-5 text-left transition hover:scale-[1.01]"
          style={{
            background: UI.paper,
            borderColor: UI.line,
          }}
        >
          <span className="text-xs font-black" style={{ color: UI.muted }}>
            เช็คอิน
          </span>

          <div className="mt-2 flex items-center gap-3">
            <CalendarDays size={22} color={UI.orange} />
            <p className="text-xl font-black">{formatDateShort(checkIn)}</p>
          </div>

          <input
            ref={dateInputRef}
            type="date"
            value={checkIn}
            onChange={(event) => onCheckInChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="เลือกวันเช็คอิน"
          />
        </button>

        <div
          className="rounded-3xl border p-5"
          style={{
            background: UI.paper,
            borderColor: UI.line,
          }}
        >
          <span className="text-xs font-black" style={{ color: UI.muted }}>
            จำนวนคืน
          </span>

          <div className="mt-3 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onNightsChange(Math.max(1, nights - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: UI.black }}
            >
              <Minus size={17} />
            </button>

            <p className="text-2xl font-black">{nights} คืน</p>

            <button
              type="button"
              onClick={() => onNightsChange(Math.min(30, nights + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: UI.orange }}
            >
              <Plus size={17} />
            </button>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryOpen((prev) => !prev)}
            className="flex min-h-[86px] w-full items-center justify-between rounded-3xl border p-5 text-left transition hover:scale-[1.01]"
            style={{
              background: UI.paper,
              borderColor: UI.line,
            }}
          >
            <div>
              <span className="text-xs font-black" style={{ color: UI.muted }}>
                ประเภทห้อง
              </span>
              <p className="mt-1 text-lg font-black">{selectedText}</p>
            </div>

            <ChevronDown color={UI.orange} />
          </button>

          {categoryOpen && (
            <div
              className="absolute right-0 top-[96px] z-50 w-full overflow-hidden rounded-3xl border p-2 shadow-2xl"
              style={{
                background: UI.paper,
                borderColor: UI.line,
              }}
            >
              <button
                type="button"
                onClick={onClearCategories}
                className="mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black"
                style={{
                  background:
                    selectedCategories.length === 0 ? UI.orange : "#f8fafc",
                  color: selectedCategories.length === 0 ? "white" : UI.ink,
                }}
              >
                ทั้งหมด
                {selectedCategories.length === 0 && <Check size={16} />}
              </button>

              {categories.map((category) => {
                const active = selectedCategories.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black"
                    style={{
                      background: active ? UI.orange : "transparent",
                      color: active ? "white" : UI.ink,
                    }}
                  >
                    <span>{category.label}</span>
                    <span
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        background: active
                          ? "rgba(255,255,255,0.2)"
                          : UI.orangeSoft,
                        color: active ? "white" : UI.orange,
                      }}
                    >
                      {category.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryTabs({
  categories,
  selectedCategories,
  onToggle,
  onClear,
}: {
  categories: { id: string; label: string; count: number }[];
  selectedCategories: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 rounded-2xl px-5 py-3 text-sm font-black"
        style={{
          background: selectedCategories.length === 0 ? UI.black : UI.paper,
          color: selectedCategories.length === 0 ? "white" : UI.ink,
          border: `1px solid ${
            selectedCategories.length === 0 ? UI.black : UI.line
          }`,
        }}
      >
        ทั้งหมด
      </button>

      {categories.map((category) => {
        const active = selectedCategories.includes(category.id);

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onToggle(category.id)}
            className="flex shrink-0 items-center gap-3 rounded-2xl px-5 py-3 text-sm font-black"
            style={{
              background: active ? UI.black : UI.paper,
              color: active ? "white" : UI.ink,
              border: `1px solid ${active ? UI.black : UI.line}`,
            }}
          >
            {category.label}
            <span
              className="rounded-full px-2 py-1 text-xs text-white"
              style={{ background: category.count > 0 ? UI.orange : UI.red }}
            >
              {category.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  dark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div
      className="rounded-[30px] border p-5 shadow-sm"
      style={{
        background: dark ? UI.black : UI.paper,
        borderColor: dark ? UI.black : UI.line,
        color: dark ? "white" : UI.ink,
      }}
    >
      <div style={{ color: UI.orange }}>{icon}</div>
      <p
        className="mt-4 text-sm font-black"
        style={{ color: dark ? "rgba(255,255,255,0.55)" : UI.muted }}
      >
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoStrip({
  packageIncludes,
  promotions,
  policies,
}: {
  packageIncludes: PackageInclude[];
  promotions: Promotion[];
  policies: ResortPolicy[];
}) {
  return (
    <div
      className="mt-7 rounded-[34px] border p-5"
      style={{
        background: "#fffaf4",
        borderColor: "#fed7aa",
      }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: UI.orange }}
          >
            <Flame size={26} />
          </div>

          <div>
            <h2 className="text-2xl font-black">
              เลือกห้องก่อน แล้วค่อยเลือกจำนวนผู้เข้าพัก
            </h2>

            <p
              className="mt-1 text-sm font-semibold leading-6"
              style={{ color: UI.muted }}
            >
              กด “จองเลย” เพื่อเลือกจำนวนห้อง ผู้ใหญ่ และเด็ก ก่อนเพิ่มลงรถเข็น
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {packageIncludes.slice(0, 5).map((item) => (
                <span
                  key={item.id}
                  className="rounded-full px-3 py-2 text-xs font-black"
                  style={{
                    background: "#ecfdf5",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 lg:min-w-[300px]">
          {promotions.slice(0, 2).map((promo) => (
            <div
              key={promo.id}
              className="rounded-2xl px-4 py-3 text-sm font-black"
              style={{
                background: UI.paper,
                border: `1px solid ${UI.line}`,
              }}
            >
              {promo.title}
            </div>
          ))}

          {policies.slice(0, 1).map((policy) => (
            <div
              key={policy.id}
              className="rounded-2xl px-4 py-3 text-sm font-black"
              style={{
                background: UI.paper,
                border: `1px solid ${UI.line}`,
                color: UI.orange,
              }}
            >
              {policy.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div
      className="mt-8 rounded-[34px] p-10 text-center"
      style={{
        background: UI.paper,
        border: `1px solid ${UI.line}`,
      }}
    >
      <Loader2 className="mx-auto animate-spin" size={46} color={UI.orange} />
      <p className="mt-4 text-2xl font-black">กำลังโหลดข้อมูลห้องพัก</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
        กรุณารอสักครู่
      </p>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div
      className="mt-8 rounded-[34px] border p-6"
      style={{
        background: "#fff1f2",
        borderColor: "#fecdd3",
      }}
    >
      <div className="flex gap-3">
        <AlertCircle className="shrink-0 text-red-600" size={28} />
        <div>
          <p className="text-xl font-black text-red-700">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="mt-2 text-sm font-semibold leading-7 text-red-600">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyBlock() {
  return (
    <div
      className="mt-8 rounded-[34px] p-10 text-center"
      style={{
        background: UI.paper,
        border: `1px solid ${UI.line}`,
      }}
    >
      <Search className="mx-auto" size={50} color={UI.orange} />
      <p className="mt-4 text-2xl font-black">ไม่พบประเภทห้องที่เลือก</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
        ลองเปลี่ยนประเภทห้อง หรือกดดูทั้งหมด
      </p>
    </div>
  );
}

function RoomCard({
  room,
  checkIn,
  nights,
  bookingRanges,
  onBook,
  onDetail,
}: {
  room: DisplayRoom;
  checkIn: string;
  nights: number;
  bookingRanges: BookingRange[];
  onBook: () => void;
  onDetail: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"RATE" | "CALENDAR">("RATE");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const date = new Date(`${checkIn}T00:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const gallery = useMemo(() => getRoomGallery(room), [room]);
  const soldOut = room.available <= 0;

  useEffect(() => {
    setImageIndex(0);
  }, [room.id]);

  useEffect(() => {
    if (gallery.length <= 1) return;

    const timer = window.setInterval(() => {
      setImageIndex((prev) => (prev + 1) % gallery.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [gallery.length]);

  return (
    <article
      className="lift-card fade-up overflow-hidden rounded-[38px] border shadow-sm"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 22px 70px rgba(15, 23, 42, 0.10)",
      }}
    >
      <div className="grid lg:grid-cols-[45%_55%]">
        <div
          className="relative min-h-[330px] overflow-hidden"
          style={{ background: "#e2e8f0" }}
        >
          <Image
            src={gallery[imageIndex] || "/images/tent-1.jpg"}
            alt={room.name}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover transition duration-700"
          />

          <div className="absolute left-5 top-5 rounded-2xl bg-black/70 px-4 py-2 text-sm font-black text-white backdrop-blur">
            {getCategoryLabel(room.category)}
          </div>

          {gallery.length > 1 && (
            <>
              <div className="absolute bottom-5 left-5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setImageIndex(
                      (prev) => (prev - 1 + gallery.length) % gallery.length
                    )
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                  aria-label="รูปก่อนหน้า"
                >
                  <ChevronLeft />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImageIndex((prev) => (prev + 1) % gallery.length)
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                  aria-label="รูปถัดไป"
                >
                  <ChevronRight />
                </button>
              </div>

              <div className="absolute bottom-5 right-5 flex gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur">
                {gallery.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setImageIndex(index)}
                    className="h-2.5 w-2.5 rounded-full transition"
                    style={{
                      background:
                        imageIndex === index
                          ? UI.orange
                          : "rgba(255,255,255,0.55)",
                    }}
                    aria-label={`ดูรูปที่ ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-2 text-xs font-black text-white"
                  style={{ background: soldOut ? UI.red : UI.green }}
                >
                  {soldOut ? "เต็ม" : `ว่าง ${room.available} ${room.unit_label}`}
                </span>

                {room.is_pet_allowed && (
                  <span
                    className="rounded-full px-3 py-2 text-xs font-black"
                    style={{
                      background: "#ecfdf5",
                      color: "#15803d",
                    }}
                  >
                    สัตว์เลี้ยงพักฟรี
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
                {room.name}
              </h2>

              <p
                className="mt-3 max-w-2xl text-sm font-semibold leading-7"
                style={{ color: UI.muted }}
              >
                {room.description ||
                  "ที่พักบรรยากาศดี พร้อมแพ็กเกจอาหารและเครื่องดื่ม"}
              </p>
            </div>

            <div
              className="rounded-[28px] p-5 text-center"
              style={{ background: UI.cream }}
            >
              <p className="text-xs font-black" style={{ color: UI.muted }}>
                เริ่มต้น
              </p>
              <p className="mt-1 text-3xl font-black" style={{ color: UI.orange }}>
                ฿{room.startingPrice.toLocaleString()}
              </p>
              <p className="text-xs font-black" style={{ color: UI.muted }}>
                / คน / คืน
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <FeatureCard
              icon={<UsersRound size={22} />}
              label="เข้าพักได้"
              value={`${room.capacity} คน / ${room.unit_label}`}
            />
            <FeatureCard
              icon={<CircleDollarSign size={22} />}
              label="จันทร์-พฤหัส"
              value={`฿${room.weekdayPrice.toLocaleString()} / คน`}
            />
            <FeatureCard
              icon={<CircleDollarSign size={22} />}
              label="ศุกร์-อาทิตย์"
              value={`฿${room.weekendPrice.toLocaleString()} / คน`}
            />
          </div>

          <div
            className="mt-6 flex flex-wrap gap-3 border-b"
            style={{ borderColor: UI.line }}
          >
            <TabButton
              active={activeTab === "RATE"}
              onClick={() => setActiveTab("RATE")}
            >
              เรทราคา
            </TabButton>

            <TabButton
              active={activeTab === "CALENDAR"}
              onClick={() => setActiveTab("CALENDAR")}
            >
              สถานะห้องว่าง
            </TabButton>
          </div>

          {activeTab === "RATE" && <RateTab room={room} />}

          {activeTab === "CALENDAR" && (
            <AvailabilityCalendar
              room={room}
              calendarMonth={calendarMonth}
              bookingRanges={bookingRanges}
              onMonthChange={(date) => setCalendarMonth(date)}
            />
          )}

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm font-bold" style={{ color: UI.muted }}>
              เช็คอิน {formatDateShort(checkIn)} • {nights} คืน • รวมโดยประมาณ{" "}
              <span className="font-black" style={{ color: UI.ink }}>
                ฿{room.totalForOneUnit.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onDetail}
                className="tap-card inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-6 text-sm font-black transition hover:scale-[1.02]"
                style={{
                  background: UI.paper,
                  color: UI.ink,
                  borderColor: UI.line,
                }}
              >
                <Eye size={19} />
                รายละเอียด
              </button>

              <button
                type="button"
                onClick={onBook}
                disabled={soldOut}
                className="tap-card camp-shimmer inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-black text-white transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: soldOut ? "#94a3b8" : UI.orange,
                  boxShadow: soldOut
                    ? "none"
                    : "0 14px 32px rgba(249,115,22,0.22)",
                }}
              >
                <ShoppingCart size={19} />
                {soldOut ? "ห้องเต็ม" : "จองเลย"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-t-2xl px-5 py-3 text-sm font-black"
      style={{
        background: active ? UI.paper : "transparent",
        color: active ? UI.ink : UI.muted,
        border: active ? `1px solid ${UI.line}` : "1px solid transparent",
        borderBottomColor: active ? UI.paper : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function RateTab({ room }: { room: DisplayRoom }) {
  return (
    <div
      className="mt-6 rounded-[30px] border p-5"
      style={{ borderColor: UI.line }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-center">
        <div>
          <h3 className="text-2xl font-black">แพ็กเกจปกติ</h3>

          <p
            className="mt-2 text-sm font-semibold leading-7"
            style={{ color: UI.muted }}
          >
            รวมบุฟเฟ่ต์ 2 มื้อ เครื่องดื่มฟรี และของทานเล่นตลอดช่วงที่กำหนด
          </p>

          <ul
            className="mt-4 grid gap-2 text-sm font-semibold leading-6"
            style={{ color: UI.muted }}
          >
            <li className="flex gap-2">
              <span style={{ color: UI.orange }}>•</span>
              เช็คอิน 14:30 น. / เช็คเอาท์ 11:00 น.
            </li>
            <li className="flex gap-2">
              <span style={{ color: UI.orange }}>•</span>
              มื้อเช้า 07:00 - 10:00 และมื้อเย็น 18:00 - 21:00
            </li>
            <li className="flex gap-2">
              <span style={{ color: UI.orange }}>•</span>
              ราคาเป็นราคาต่อคน / ต่อคืน
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <PriceChip text="อาหารเช้า" />
            <PriceChip text="อาหารเย็น" />
            <PriceChip text="เครื่องดื่มฟรี" />
            <PriceChip text="ของทานเล่น" />
          </div>
        </div>

        <div
          className="rounded-[30px] p-5 text-center"
          style={{
            background: UI.cream,
            border: `1px solid ${UI.line}`,
          }}
        >
          <p className="text-xs font-black" style={{ color: UI.muted }}>
            จันทร์ - พฤหัส
          </p>
          <p className="mt-1 text-3xl font-black" style={{ color: UI.orange }}>
            ฿{room.weekdayPrice.toLocaleString()}
          </p>
          <p className="text-xs font-black" style={{ color: UI.muted }}>
            / คน / คืน
          </p>

          <div className="my-4 h-px" style={{ background: UI.line }} />

          <p className="text-xs font-black" style={{ color: UI.muted }}>
            ศุกร์ - อาทิตย์
          </p>
          <p className="mt-1 text-3xl font-black" style={{ color: UI.orange }}>
            ฿{room.weekendPrice.toLocaleString()}
          </p>
          <p className="text-xs font-black" style={{ color: UI.muted }}>
            / คน / คืน
          </p>
        </div>
      </div>
    </div>
  );
}

function PriceChip({ text }: { text: string }) {
  return (
    <span
      className="rounded-full px-3 py-2 text-xs font-black"
      style={{
        background: UI.orangeSoft,
        color: UI.orange,
        border: "1px solid #fed7aa",
      }}
    >
      {text}
    </span>
  );
}

function AvailabilityCalendar({
  room,
  calendarMonth,
  bookingRanges,
  onMonthChange,
}: {
  room: DisplayRoom;
  calendarMonth: Date;
  bookingRanges: BookingRange[];
  onMonthChange: (date: Date) => void;
}) {
  const days = getCalendarDays(calendarMonth);
  const currentYear = calendarMonth.getFullYear();
  const currentMonth = calendarMonth.getMonth();
  const [monthAvailability, setMonthAvailability] = useState<
    CalendarDayAvailability[]
  >([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  const yearOptions = Array.from({ length: 9 }).map((_, index) => {
    return currentYear - 4 + index;
  });

  const availabilityByDate = useMemo(() => {
    return new Map(monthAvailability.map((day) => [day.date, day]));
  }, [monthAvailability]);

  useEffect(() => {
    let active = true;

    async function loadMonthAvailability() {
      try {
        setCalendarLoading(true);
        setCalendarError("");

        const params = new URLSearchParams({
          roomId: String(room.id || ""),
          roomName: room.name || "",
          year: String(currentYear),
          month: String(currentMonth + 1),
        });

        const response = await fetch(`/api/availability?${params.toString()}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Cannot load availability");
        }

        if (active) {
          setMonthAvailability(result.days || []);
        }
      } catch (error) {
        console.error("LOAD_CALENDAR_AVAILABILITY_ERROR", error);

        if (active) {
          setMonthAvailability([]);
          setCalendarError("โหลดจำนวนห้องว่างจริงไม่สำเร็จ");
        }
      } finally {
        if (active) {
          setCalendarLoading(false);
        }
      }
    }

    loadMonthAvailability();

    return () => {
      active = false;
    };
  }, [currentMonth, currentYear, room.id, room.name]);

  function setPrevMonth() {
    onMonthChange(new Date(currentYear, currentMonth - 1, 1));
  }

  function setNextMonth() {
    onMonthChange(new Date(currentYear, currentMonth + 1, 1));
  }

  function handleMonthSelect(monthValue: string) {
    onMonthChange(new Date(currentYear, Number(monthValue), 1));
  }

  function handleYearSelect(yearValue: string) {
    onMonthChange(new Date(Number(yearValue), currentMonth, 1));
  }

  return (
    <div className="mt-6">
      <div
        className="overflow-hidden rounded-[32px] border"
        style={{
          background: UI.paper,
          borderColor: UI.line,
          boxShadow: "0 14px 40px rgba(15,23,42,0.06)",
        }}
      >
        <div
          className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
          style={{
            background:
              "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #fff3e8 100%)",
          }}
        >
          <div>
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: UI.orange }}
            >
              <CalendarDays size={24} />
            </div>

            <h3 className="mt-3 text-3xl font-black leading-tight">
              ปฏิทินห้องว่าง
            </h3>

            <p
              className="mt-2 text-sm font-semibold leading-6"
              style={{ color: UI.muted }}
            >
              อิงจำนวนห้องว่างจริงจากฐานข้อมูลของเดือนที่เลือก
              {calendarLoading ? " กำลังโหลด..." : ""}
              {calendarError ? ` ${calendarError}` : ""}
            </p>
          </div>

          <div
            className="rounded-[28px] border p-2"
            style={{
              background: "rgba(255,255,255,0.78)",
              borderColor: UI.line,
            }}
          >
            <div className="grid gap-2 sm:grid-cols-[48px_1fr_1fr_48px]">
              <button
                type="button"
                onClick={setPrevMonth}
                className="flex h-12 items-center justify-center rounded-2xl text-white"
                style={{ background: UI.black }}
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft size={20} />
              </button>

              <select
                value={currentMonth}
                onChange={(event) => handleMonthSelect(event.target.value)}
                className="h-12 rounded-2xl border px-4 text-sm font-black outline-none"
                style={{
                  background: UI.paper,
                  borderColor: UI.line,
                  color: UI.ink,
                }}
              >
                {FULL_THAI_MONTHS.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(event) => handleYearSelect(event.target.value)}
                className="h-12 rounded-2xl border px-4 text-sm font-black outline-none"
                style={{
                  background: UI.paper,
                  borderColor: UI.line,
                  color: UI.ink,
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={setNextMonth}
                className="flex h-12 items-center justify-center rounded-2xl text-white"
                style={{ background: UI.orange }}
                aria-label="เดือนถัดไป"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-5">
          <div
            className="overflow-hidden rounded-[26px] border"
            style={{ borderColor: UI.line }}
          >
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-xs font-black text-white md:text-sm"
                  style={{ background: UI.black }}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((item) => {
                const apiAvailability = item.inMonth
                  ? availabilityByDate.get(item.dateString)
                  : null;
                const available = item.inMonth
                  ? apiAvailability?.available ??
                    (calendarLoading
                      ? null
                      : getRoomAvailableOnDate(room, bookingRanges, item.dateString))
                  : null;
                const totalUnits = apiAvailability?.total ?? room.totalUnits;

                const status = getAvailabilityStatus(available, totalUnits);

                return (
                  <div
                    key={item.key}
                    className="flex min-h-[72px] flex-col items-center justify-center border p-1 text-center md:min-h-[96px] md:p-2"
                    style={{
                      borderColor: UI.line,
                      background: !item.inMonth ? "#f1f5f9" : status.bg,
                      color: !item.inMonth ? "#94a3b8" : status.text,
                    }}
                  >
                    <p className="text-base font-black leading-none md:text-xl">
                      {item.day}
                    </p>

                    {item.inMonth && (
                      <p className="mt-2 text-[11px] font-black md:text-sm">
                        {available === null ? "..." : `${available} ว่าง`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-black">
            <Legend color="#16a34a" text="ว่างเยอะ" />
            <Legend color="#84cc16" text="ค่อนข้างว่าง" />
            <Legend color="#f97316" text="ใกล้เต็ม" />
            <Legend color="#ef4444" text="เต็ม" />
            <Legend color="#e2e8f0" text="นอกเดือน" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      {text}
    </div>
  );
}

function FeatureCard({
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
        background: "#f8fafc",
        borderColor: "#e2e8f0",
      }}
    >
      <div style={{ color: UI.orange }}>{icon}</div>
      <p className="mt-3 text-xs font-black" style={{ color: UI.muted }}>
        {label}
      </p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function RoomDetailModal({
  room,
  packageIncludes,
  promotions,
  policies,
  onClose,
}: {
  room: DetailRoom;
  packageIncludes: PackageInclude[];
  promotions: Promotion[];
  policies: ResortPolicy[];
  onClose: () => void;
}) {
  if (!room) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm md:px-4 md:py-6">
      <div
        className="mobile-slide-panel max-h-[calc(100vh-32px)] w-full max-w-3xl overflow-y-auto rounded-[28px] border shadow-2xl md:max-h-[calc(100vh-48px)] md:rounded-[36px]"
        style={{
          background: UI.paper,
          borderColor: UI.line,
        }}
      >
        <div
          className="flex items-start justify-between gap-3 p-4 md:gap-4 md:p-6"
          style={{ background: UI.black }}
        >
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: UI.orange }}
            >
              Room Detail
            </p>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">{room.name}</h2>
            <p className="mt-2 text-sm font-semibold text-white/55">
              {room.description || "รายละเอียดแพ็กเกจและเงื่อนไขที่พัก"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X />
          </button>
        </div>

        <div className="grid gap-5 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <FeatureCard
              icon={<UsersRound size={22} />}
              label="เข้าพักได้"
              value={`${room.capacity} คน / ${room.unit_label}`}
            />
            <FeatureCard
              icon={<CircleDollarSign size={22} />}
              label="วันธรรมดา"
              value={`฿${room.weekdayPrice.toLocaleString()} / คน`}
            />
            <FeatureCard
              icon={<CircleDollarSign size={22} />}
              label="ศุกร์-อาทิตย์"
              value={`฿${room.weekendPrice.toLocaleString()} / คน`}
            />
          </div>

          <DetailSection icon={<Utensils size={22} />} title="สิ่งที่รวมในแพ็กเกจ">
            <div className="grid gap-3">
              {packageIncludes.length > 0 ? (
                packageIncludes.map((item) => (
                  <DetailItem
                    key={item.id}
                    title={item.title}
                    description={item.description || ""}
                    image={getPackageDetailImage(item)}
                  />
                ))
              ) : (
                <>
                  <DetailItem
                    title="บุฟเฟ่ต์มื้อเช้า"
                    description="มื้อเช้า 07:00 - 10:00"
                    image="/images/package/breakfast.jpg"
                  />
                  <DetailItem
                    title="บุฟเฟ่ต์มื้อเย็น"
                    description="มื้อเย็น 18:00 - 21:00 รวมหมูกระทะ ซีฟู้ด และเบียร์"
                    image="/images/package/evening.jpg"
                  />
                  <DetailItem
                    title="เครื่องดื่มฟรีตลอดการเข้าพัก"
                    description="น้ำอัดลม / โซดา / น้ำแข็ง / ไอติม"
                    image="/images/package/drink.jpg"
                  />
                  <DetailItem
                    title="ของทานเล่นฟรี"
                    description="ตั้งแต่ Check-in - 21:00"
                    image="/images/package/pop.jpg"
                  />
                </>
              )}
            </div>
          </DetailSection>

          <DetailSection icon={<Gift size={22} />} title="โปรโมชั่นสำหรับมาเป็นกลุ่ม">
            <div className="grid gap-3">
              {promotions.length > 0 ? (
                promotions.map((promo) => (
                  <DetailItem
                    key={promo.id}
                    title={`${promo.min_guests} คนขึ้นไป`}
                    description={`${promo.title} • ${promo.description}`}
                    image={getPromotionImage(promo.title)}
                  />
                ))
              ) : (
                <>
                  <DetailItem
                    title="6 คนขึ้นไป"
                    description="ฟรี! ห้องคาราโอเกะส่วนตัว ร้องได้ทั้งคืน"
                    image="/images/package/karaoke.jpg"
                  />
                  <DetailItem
                    title="10 คนขึ้นไป"
                    description="ฟรี! ห้องปาร์ตี้ส่วนตัว คาราโอเกะ โต๊ะพูล และห้องพักในตัว 2 ห้อง"
                    image="/images/package/party.jpg"
                  />
                </>
              )}
            </div>
          </DetailSection>

          <DetailSection icon={<PawPrint size={22} />} title="นโยบายสัตว์เลี้ยง">
            <div className="grid gap-3">
              {policies.length > 0 ? (
                policies.map((policy) => (
                  <DetailItem
                    key={policy.id}
                    title={policy.title}
                    description={policy.description}
                    image={getPolicyImage(policy.title)}
                  />
                ))
              ) : (
                <DetailItem
                  title="สัตว์เลี้ยงพักฟรี"
                  description="เฉพาะห้องพักแบบรีสอร์ทเท่านั้น"
                  image="/images/package/pet.jpg"
                />
              )}
            </div>
          </DetailSection>

          <button
            type="button"
            onClick={onClose}
            className="min-h-14 rounded-2xl text-sm font-black text-white"
            style={{ background: UI.orange }}
          >
            ปิดรายละเอียด
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-[28px] border p-5"
      style={{ background: "#fffaf4", borderColor: "#fed7aa" }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span style={{ color: UI.orange }}>{icon}</span>
        <h3 className="text-xl font-black">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function DetailItem({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) {
  return (
    <div className="grid gap-4 rounded-[26px] bg-white p-4 shadow-sm md:grid-cols-[180px_1fr] md:items-center">
      {image ? (
        <div className="relative h-40 w-full overflow-hidden rounded-[22px] bg-slate-200 md:h-32">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 180px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div>
        <h3 className="text-xl font-black text-[#101010]">{title}</h3>

        <p className="mt-2 text-sm font-semibold leading-7 text-slate-600 md:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}

function PocketModal({
  room,
  checkIn,
  nights,
  checkOut,
  quantity,
  adults,
  children,
  onClose,
  onQuantityChange,
  onAdultsChange,
  onChildrenChange,
  onConfirm,
}: {
  room: PocketRoom;
  checkIn: string;
  nights: number;
  checkOut: string;
  quantity: number;
  adults: number;
  children: number;
  onClose: () => void;
  onQuantityChange: (value: number) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onConfirm: () => void;
}) {
  if (!room) return null;

  const total = calculateRoomTotal({
    room,
    checkIn,
    nights,
    adults,
    children,
    quantity,
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm md:px-4 md:py-6">
      <div
        className="mobile-slide-panel max-h-[calc(100vh-32px)] w-full max-w-xl overflow-y-auto rounded-[28px] border shadow-2xl md:max-h-[calc(100vh-48px)] md:rounded-[36px]"
        style={{
          background: UI.paper,
          borderColor: UI.line,
        }}
      >
        <div
          className="flex items-start justify-between gap-3 p-4 md:gap-4 md:p-6"
          style={{ background: UI.black }}
        >
          <div>
            <p
              className="text-xs font-black uppercase tracking-[0.22em]"
              style={{ color: UI.orange }}
            >
              Booking Pocket
            </p>
            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">{room.name}</h2>
            <p className="mt-2 text-sm font-semibold text-white/55">
              {formatDateShort(checkIn)} - {formatDateShort(checkOut)} • {nights} คืน
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X />
          </button>
        </div>

        <div className="grid gap-5 p-4 md:p-5">
          <Counter
            label="จำนวนห้อง"
            helper={`เหลือว่าง ${room.available} ${room.unit_label}`}
            value={quantity}
            min={1}
            max={Math.max(room.available, 1)}
            onChange={onQuantityChange}
          />

          <Counter
            label="ผู้ใหญ่"
            helper="คิดราคาต่อคน / ต่อคืน"
            value={adults}
            min={0}
            max={room.capacity * quantity}
            onChange={onAdultsChange}
          />

          <Counter
            label="เด็ก"
            helper="สำหรับน้องส่วนสูงไม่ถึง 110 cm เข้าฟรี!
                    สำหรับน้องส่วนสูง 110 - 150 cm คนละ 500.-
                    สำหรับน้องที่สูงเกิน 150 cm ขึ้นไป จ่ายเป็นราคาผู้ใหญ่
                         ส่วนนี้จะคิดก่อนเข้าพัก"
            value={children}
            min={0}
            max={room.capacity * quantity}
            onChange={onChildrenChange}
          />

          <div className="rounded-[28px] p-5" style={{ background: UI.cream }}>
            <p className="text-sm font-black" style={{ color: UI.muted }}>
              สรุปยอดรายการนี้
            </p>
            <p className="mt-2 text-4xl font-black" style={{ color: UI.orange }}>
              ฿{total.toLocaleString()}
            </p>
            <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
              ราคาอิงตามวันเข้าพักจริง จันทร์-พฤหัส / ศุกร์-อาทิตย์
            </p>
          </div>

          <button
            type="button"
            onClick={onConfirm}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white"
            style={{ background: UI.orange }}
          >
            <ShoppingCart size={19} />
            เพิ่มไปยังรถเข็น
          </button>
        </div>
      </div>
    </div>
  );
}

function Counter({
  label,
  helper,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-[24px] border p-4"
      style={{ borderColor: UI.line }}
    >
      <div>
        <p className="text-lg font-black">{label}</p>
        <p className="mt-1 text-sm font-semibold" style={{ color: UI.muted }}>
          {helper}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{ background: UI.black }}
        >
          <Minus size={17} />
        </button>

        <p className="w-10 text-center text-xl font-black">{value}</p>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{ background: UI.orange }}
        >
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}

function CartDrawer({
  open,
  items,
  total,
  bookingRanges,
  promoAvailability,
  checkIn,
  checkOut,
  onClose,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  items: CartItem[];
  total: number;
  bookingRanges: BookingRange[];
  promoAvailability: PromoAvailability;
  checkIn: string;
  checkOut: string;
  onClose: () => void;
  onRemove: (cartId: string) => void;
  onCheckout: () => void;
}) {
  if (!open) return null;

  const summary = getCartSummary(items);
  const benefit = getGroupBenefits(summary.adults, promoAvailability);

  return (
    <div className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-md">
      <div
        className="mobile-slide-panel ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden shadow-2xl"
        style={{ background: "#f8f1e8" }}
      >
        <div
          className="relative overflow-hidden p-4 pb-5 text-white sm:p-6 sm:pb-7"
          style={{
            background:
              "linear-gradient(135deg, #101010 0%, #1b1b1b 52%, #3a1b07 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-30 blur-3xl"
            style={{ background: UI.orange }}
          />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.28em]"
                style={{ color: UI.orange }}
              >
                Rhino Cart
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">รถเข็น</h2>

              <p className="mt-2 text-sm font-semibold text-white/55">
                ตรวจสอบรายการก่อนกรอกข้อมูลผู้จอง
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="tap-card flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:h-14 sm:w-14"
            >
              <X size={30} />
            </button>
          </div>

          <div className="relative mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <CartMiniStat label="ห้อง" value={summary.rooms} />
            <CartMiniStat label="ผู้ใหญ่" value={summary.adults} />
            <CartMiniStat label="รวมคน" value={summary.guests} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {items.length === 0 ? (
            <div
              className="flex min-h-[360px] flex-col items-center justify-center rounded-[34px] border border-dashed p-8 text-center"
              style={{ borderColor: UI.line, background: UI.cream }}
            >
              <ShoppingCart size={56} color={UI.orange} />

              <p className="mt-5 text-2xl font-black">ยังไม่มีรายการในรถเข็น</p>

              <p
                className="mt-2 max-w-sm text-sm font-semibold leading-7"
                style={{ color: UI.muted }}
              >
                กด “จองเลย” ที่ห้องพักที่ต้องการ แล้วรายการจะมาแสดงตรงนี้
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              <div
                className="overflow-hidden rounded-[32px] border p-5 shadow-sm"
                style={{
                  background:
                    benefit.level === "NONE"
                      ? UI.cream
                      : "linear-gradient(135deg, #ecfdf5 0%, #fff7ed 100%)",
                  borderColor: benefit.level === "NONE" ? UI.line : "#86efac",
                }}
              >
                <div className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{
                      background:
                        benefit.level === "NONE" ? UI.black : UI.green,
                    }}
                  >
                    <Gift size={24} />
                  </div>

                  <div>
                    <p className="text-lg font-black">{benefit.title}</p>

                    <p
                      className="mt-1 text-sm font-black"
                      style={{
                        color:
                          benefit.level === "NONE" ? UI.orange : UI.green,
                      }}
                    >
                      {benefit.subtitle}
                    </p>

                    <p
                      className="mt-2 text-sm font-semibold leading-6"
                      style={{ color: UI.muted }}
                    >
                      {benefit.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <PromoMiniGauge
                        label="Karaoke"
                        used={promoAvailability.usedKaraoke}
                        remaining={promoAvailability.karaoke}
                      />
                      <PromoMiniGauge
                        label="Party"
                        used={promoAvailability.usedParty}
                        remaining={promoAvailability.party}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {items.map((item, index) => {
                const totalAdults = item.adults * item.quantity;
                const totalChildren = item.children * item.quantity;
                const totalGuests = totalAdults + totalChildren;

                return (
                  <div
                    key={item.cartId}
                    className="lift-card overflow-hidden rounded-[32px] border shadow-sm"
                    style={{
                      background: UI.paper,
                      borderColor: UI.line,
                      boxShadow: "0 16px 44px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                      <div className="relative h-32 overflow-hidden rounded-[24px] bg-slate-200 sm:h-28">
                        <Image
                          src={item.coverImage || "/images/tent-1.jpg"}
                          alt={item.roomName}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="text-xs font-black uppercase tracking-[0.18em]"
                          style={{ color: UI.orange }}
                        >
                          ห้องที่ {index + 1}
                        </p>

                        <h3 className="mt-1 text-xl font-black">
                          {item.roomName}
                        </h3>

                        <div
                          className="mt-3 flex flex-wrap gap-2 text-xs font-black"
                          style={{ color: UI.muted }}
                        >
                          <span className="rounded-full bg-slate-100 px-3 py-2">
                            {item.quantity} ห้อง
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-2">
                            ผู้ใหญ่ {totalAdults}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-2">
                            เด็ก {totalChildren}
                          </span>
                          <span className="rounded-full bg-orange-50 px-3 py-2 text-orange-600">
                            รวม {totalGuests} คน
                          </span>
                        </div>

                        <p
                          className="mt-3 text-xs font-semibold"
                          style={{ color: UI.muted }}
                        >
                          {formatDateShort(item.checkIn)} -{" "}
                          {formatDateShort(item.checkOut)} • {item.nights} คืน
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                        <button
                          type="button"
                          onClick={() => onRemove(item.cartId)}
                          className="tap-card flex h-12 w-12 items-center justify-center rounded-2xl"
                          style={{
                            background: "#fee2e2",
                            color: UI.red,
                          }}
                        >
                          <Trash2 size={19} />
                        </button>

                        <p
                          className="text-2xl font-black"
                          style={{ color: UI.orange }}
                        >
                          ฿{item.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className="mobile-safe-area border-t p-4 sm:p-5"
          style={{
            borderColor: UI.line,
            background: "rgba(255,255,255,0.92)",
          }}
        >
          <div className="mb-4 grid gap-3 min-[380px]:grid-cols-[1fr_auto] min-[380px]:items-end">
            <div>
              <p className="text-sm font-black" style={{ color: UI.muted }}>
                ยอดรวมทั้งหมด
              </p>

              <p className="mt-1 text-sm font-semibold" style={{ color: UI.muted }}>
                {summary.nights} คืน • {summary.rooms} ห้อง • {summary.guests} คน
              </p>
            </div>

            <p className="break-words text-3xl font-black sm:text-4xl" style={{ color: UI.orange }}>
              ฿{total.toLocaleString()}
            </p>
          </div>

          <button
            type="button"
            onClick={onCheckout}
            disabled={items.length === 0}
            className="tap-card camp-shimmer flex min-h-14 w-full items-center justify-center rounded-2xl text-sm font-black text-white transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: UI.orange }}
          >
            ไปหน้ากรอกข้อมูลผู้จอง
          </button>
        </div>
      </div>
    </div>
  );
}

function CartMiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
      <p className="text-xs font-black text-white/55">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PromoMiniGauge({
  label,
  used,
  remaining,
}: {
  label: string;
  used: number;
  remaining: number;
}) {
  const isFull = remaining <= 0;

  return (
    <div
      className="rounded-2xl border p-3"
      style={{
        background: isFull ? "#fff1f2" : "#ffffff",
        borderColor: isFull ? "#fecdd3" : "#bbf7d0",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase" style={{ color: UI.muted }}>
          {label}
        </p>
        <p
          className="text-xs font-black"
          style={{ color: isFull ? UI.red : UI.green }}
        >
          {isFull ? "เต็ม" : `เหลือ ${remaining}`}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1">
        {Array.from({ length: 2 }).map((_, index) => {
          const filled = index < used;

          return (
            <div
              key={index}
              className="h-2 rounded-full"
              style={{
                background: filled ? UI.orange : isFull ? "#fecdd3" : "#bbf7d0",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FloatingCartButton({
  count,
  total,
  onOpen,
}: {
  count: number;
  total: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tap-card pulse-soft fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full px-4 py-4 text-white shadow-2xl sm:right-5 sm:px-5 lg:bottom-5"
      style={{
        background: UI.orange,
        boxShadow: "0 18px 48px rgba(249,115,22,0.35)",
      }}
    >
      <ShoppingCart size={24} />
      <span className="font-black">{count}</span>
      {total > 0 && <span className="font-black">฿{total.toLocaleString()}</span>}
    </button>
  );
}

function calculateRoomTotal({
  room,
  checkIn,
  nights,
  adults,
  quantity,
}: {
  room: Pick<DisplayRoom, "room_rates"> | RoomType;
  checkIn: string;
  nights: number;
  adults: number;
  children: number;
  quantity: number;
}) {
  let total = 0;

  for (let i = 0; i < nights; i += 1) {
    const currentDate = addDays(checkIn, i);
    const dayType = getDayType(currentDate);

    const rate =
      room.room_rates.find((item) => item.day_type === dayType)
        ?.price_per_person || 0;

    total += rate * adults * quantity;
  }

  return total;
}

function getBookedMapForRange(
  bookings: BookingRange[],
  rangeStart: string,
  rangeEnd: string,
  rooms: Pick<RoomType, "id" | "slug">[] = []
) {
  const map = new Map<string, number>();
  const roomIdBySlug = new Map(
    rooms.map((room) => [String(room.slug || "").toLowerCase(), room.id])
  );

  bookings.forEach((booking) => {
    const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
    const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;
    const isOverlap =
      Boolean(bookingCheckIn && bookingCheckOut) &&
      bookingCheckIn! < rangeEnd &&
      bookingCheckOut! > rangeStart;

    if (!isOverlap) return;

    booking.booking_rooms?.forEach((room) => {
      const current = map.get(room.room_type_id) || 0;
      map.set(room.room_type_id, current + Number(room.quantity || 0));
    });

    booking.cart_data?.items?.forEach((room) => {
      const roomTypeId =
        room.roomTypeId ||
        room.room_type_id ||
        roomIdBySlug.get(
          String(room.roomSlug || room.room_slug || room.slug || "").toLowerCase()
        );

      if (!roomTypeId) return;

      const current = map.get(roomTypeId) || 0;
      map.set(roomTypeId, current + Math.max(Number(room.quantity || 1), 1));
    });
  });

  return map;
}

function isRhinoRoomVisible(room: Pick<RoomType, "name" | "slug" | "sell_on_rhino">) {
  const slug = String(room.slug || "").toLowerCase();
  const name = String(room.name || "").toLowerCase();

  if (room.sell_on_rhino === false) return false;
  if (slug === "gorilla-king-double" || slug === "gorilla-king-single") {
    return false;
  }
  if (name === "king size room double" || name === "king size room single") {
    return false;
  }

  return true;
}

function isRoomMatchQuery(room: Pick<RoomType, "id" | "slug" | "category">, roomType: string) {
  const value = roomType.toLowerCase();
  const slug = String(room.slug || "").toLowerCase();
  const category = String(room.category || "").toLowerCase();

  if (String(room.id).toLowerCase() === value) return true;
  if (slug === value) return true;
  if (category === value) return true;
  if (value === "tent-2p") return slug === "tent-2-person";
  if (value === "tent-4p") return slug === "tent-4-person";
  if (value === "resort" || value === "cabin") return slug === "resort-2-person";

  return false;
}

function getRoomAvailableOnDate(
  room: DisplayRoom,
  bookings: BookingRange[],
  dateString: string
) {
  const nextDate = addDays(dateString, 1);
  const map = getBookedMapForRange(bookings, dateString, nextDate, [room]);
  const booked = map.get(room.id) || 0;

  return Math.max(room.totalUnits - booked, 0);
}

function getAvailabilityStatus(
  available: number | null,
  totalUnits: number
): { bg: string; text: string } {
  if (available === null) {
    return { bg: "#f1f5f9", text: "#94a3b8" };
  }

  if (available <= 0) {
    return { bg: UI.red, text: "#ffffff" };
  }

  if (available <= Math.max(1, Math.floor(totalUnits * 0.25))) {
    return { bg: UI.orange, text: "#ffffff" };
  }

  if (available <= Math.max(1, Math.floor(totalUnits * 0.5))) {
    return { bg: "#84cc16", text: "#ffffff" };
  }

  return { bg: UI.green, text: "#ffffff" };
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    const dateString = toDateInputValue(date);

    return {
      key: dateString,
      date,
      dateString,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateInputValue(date);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateInputValue() {
  return toDateInputValue(new Date());
}

function isValidDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

function getDayType(dateString: string): "WEEKDAY" | "WEEKEND" {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();

  if (day === 0 || day === 5 || day === 6) {
    return "WEEKEND";
  }

  return "WEEKDAY";
}

function formatDateShort(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getCategoryLabel(category: string) {
  if (category === "TENT") return "ห้องกระโจม";
  if (category === "RESORT") return "ห้องรีสอร์ท";

  return category;
}

function normalizeImagePath(path?: string | null) {
  if (!path) return "";

  const value = String(path).trim();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `/${value}`;
}

function getRoomGallery(room: DisplayRoom) {
  const images: string[] = [];

  const coverImage = normalizeImagePath(room.cover_image);
  if (coverImage) images.push(coverImage);

  const galleryValue = room.gallery_images;

  if (Array.isArray(galleryValue)) {
    galleryValue.forEach((image) => {
      const normalized = normalizeImagePath(image);
      if (normalized) images.push(normalized);
    });
  }

  if (typeof galleryValue === "string") {
    try {
      const parsed = JSON.parse(galleryValue);

      if (Array.isArray(parsed)) {
        parsed.forEach((image) => {
          const normalized = normalizeImagePath(image);
          if (normalized) images.push(normalized);
        });
      } else {
        galleryValue.split(",").forEach((image) => {
          const normalized = normalizeImagePath(image);
          if (normalized) images.push(normalized);
        });
      }
    } catch {
      galleryValue.split(",").forEach((image) => {
        const normalized = normalizeImagePath(image);
        if (normalized) images.push(normalized);
      });
    }
  }

  const uniqueImages = Array.from(new Set(images));

  return uniqueImages.length > 0 ? uniqueImages : ["/images/tent-1.jpg"];
}

function getPackageDetailImage(item: PackageInclude) {
  if (item.image_url) return normalizeImagePath(item.image_url);
  if (item.icon && item.icon.startsWith("/")) return normalizeImagePath(item.icon);

  const text = item.title.toLowerCase();

  if (text.includes("เช้า")) return "/images/package/breakfast.jpg";

  if (
    text.includes("เย็น") ||
    text.includes("หมูกระทะ") ||
    text.includes("ซีฟู้ด")
  ) {
    return "/images/package/evening.jpg";
  }

  if (
    text.includes("เครื่องดื่ม") ||
    text.includes("น้ำอัดลม") ||
    text.includes("โซดา") ||
    text.includes("น้ำแข็ง") ||
    text.includes("ไอติม") ||
    text.includes("แอล")
  ) {
    return "/images/package/drink.jpg";
  }

  if (text.includes("ของทานเล่น") || text.includes("ทานเล่น")) {
    return "/images/package/pop.jpg";
  }

  return "/images/package/default.jpg";
}

function getPromotionImage(title: string) {
  const text = title.toLowerCase();

  if (text.includes("คาราโอเกะ")) return "/images/package/karaoke.jpg";
  if (text.includes("ปาร์ตี้") || text.includes("โต๊ะพูล")) {
    return "/images/package/party.jpg";
  }

  return "/images/package/promotion.jpg";
}

function getPolicyImage(title: string) {
  const text = title.toLowerCase();

  if (text.includes("สัตว์") || text.includes("เลี้ยง")) {
    return "/images/package/pet.jpg";
  }

  return "/images/package/default.jpg";
}

function getCartSummary(items: CartItem[]) {
  const rooms = items.reduce((sum, item) => sum + item.quantity, 0);

  const adults = items.reduce((sum, item) => {
    return sum + item.adults * item.quantity;
  }, 0);

  const children = items.reduce((sum, item) => {
    return sum + item.children * item.quantity;
  }, 0);

  const guests = adults + children;

  const nights = items[0]?.nights || 0;

  return {
    rooms,
    adults,
    children,
    guests,
    nights,
  };
}

function getGroupBenefitAvailability(
  bookings: BookingRange[],
  checkIn: string,
  checkOut: string
) {
  const counts = {
    karaoke: 0,
    party: 0,
  };

  bookings.forEach((booking) => {
    const bookingCheckIn = booking.check_in || booking.cart_data?.checkIn;
    const bookingCheckOut = booking.check_out || booking.cart_data?.checkOut;
    const isOverlap =
      Boolean(bookingCheckIn && bookingCheckOut) &&
      bookingCheckIn! < checkOut &&
      bookingCheckOut! > checkIn;

    if (!isOverlap) return;

    const benefit = booking.cart_data?.groupBenefit;
    if (benefit?.assigned === false) return;

    if (benefit?.level === "KARAOKE") counts.karaoke += 1;
    if (benefit?.level === "PARTY") counts.party += 1;
  });

  return {
    karaoke: Math.max(2 - counts.karaoke, 0),
    party: Math.max(2 - counts.party, 0),
  };
}

function getGroupBenefits(
  adults: number,
  availability: { karaoke: number; party: number } = { karaoke: 2, party: 2 }
) {
  if (adults >= 10) {
    const assigned = availability.party > 0;

    return {
      level: "PARTY",
      title: assigned
        ? "ได้สิทธิ์ห้องปาร์ตี้ส่วนตัว"
        : "ห้องปาร์ตี้เต็มแล้ว",
      subtitle: assigned
        ? `เหลือ ${availability.party} จาก 2 ห้องในช่วงวันที่เลือก`
        : "ครบ 10 คน แต่สิทธิ์ห้องปาร์ตี้ช่วงนี้ถูกจองครบแล้ว",
      description: assigned
        ? "ฟรีห้องปาร์ตี้ส่วนตัว ระบบจะล็อกสิทธิ์อีกครั้งตอนบันทึกการจอง"
        : "ยังจองที่พักได้ตามปกติ แต่รายการนี้จะไม่ได้สิทธิ์ห้องปาร์ตี้",
      badge: assigned ? "ฟรีห้องปาร์ตี้" : "สิทธิ์เต็มแล้ว",
      assigned,
    };
  }

  if (adults >= 6) {
    const assigned = availability.karaoke > 0;

    return {
      level: "KARAOKE",
      title: assigned
        ? "ได้สิทธิ์ห้องคาราโอเกะส่วนตัว"
        : "ห้องคาราโอเกะเต็มแล้ว",
      subtitle: assigned
        ? `เหลือ ${availability.karaoke} จาก 2 ห้องในช่วงวันที่เลือก`
        : "ครบ 6 คน แต่สิทธิ์ห้องคาราโอเกะช่วงนี้ถูกจองครบแล้ว",
      description: assigned
        ? "ฟรีห้องคาราโอเกะส่วนตัว ระบบจะล็อกสิทธิ์อีกครั้งตอนบันทึกการจอง"
        : "ยังจองที่พักได้ตามปกติ แต่รายการนี้จะไม่ได้สิทธิ์ห้องคาราโอเกะ",
      badge: assigned ? "ฟรีคาราโอเกะ" : "สิทธิ์เต็มแล้ว",
      assigned,
    };
  }

  const remain = Math.max(6 - adults, 0);

  return {
    level: "NONE",
    title: "ยังไม่ถึงโปรกลุ่ม",
    subtitle: `เพิ่มผู้ใหญ่อีก ${remain} คน จะได้ห้องคาราโอเกะ`,
    description:
      "ครบ 6 คนขึ้นไปฟรีห้องคาราโอเกะ / ครบ 10 คนขึ้นไปฟรีห้องปาร์ตี้",
    badge: "ยังไม่ได้โปร",
    assigned: false,
  };
}

function getGroupBenefitsLegacy(adults: number) {
  if (adults >= 10) {
    return {
      level: "PARTY",
      title: "ได้รับสิทธิ์ห้องปาร์ตี้ส่วนตัว",
      subtitle: "สำหรับกลุ่ม 10 คนขึ้นไป",
      description: "ฟรีห้องปาร์ตี้ส่วนตัว คาราโอเกะ โต๊ะพูล และห้องพักในตัว 2 ห้อง",
      badge: "ฟรีห้องปาร์ตี้",
    };
  }

  if (adults >= 6) {
    return {
      level: "KARAOKE",
      title: "ได้รับสิทธิ์ห้องคาราโอเกะส่วนตัว",
      subtitle: "สำหรับกลุ่ม 6 คนขึ้นไป",
      description: "ฟรีห้องคาราโอเกะส่วนตัว ร้องได้ทั้งคืน",
      badge: "ฟรีคาราโอเกะ",
    };
  }

  const remain = 6 - adults;

  return {
    level: "NONE",
    title: "ยังไม่ถึงโปรกลุ่ม",
    subtitle: `เพิ่มผู้ใหญ่อีก ${remain} คน จะได้ห้องคาราโอเกะ`,
    description: "ครบ 6 คนขึ้นไป ฟรีห้องคาราโอเกะ / ครบ 10 คนขึ้นไป ฟรีห้องปาร์ตี้",
    badge: "ยังไม่ได้โปร",
  };
}
