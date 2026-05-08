"use client";

import Image from "next/image";
import { useState } from "react";
import {
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Info,
  LockKeyhole,
  Minus,
  Plus,
  ShieldAlert,
  ShoppingCart,
  Star,
  UsersRound,
  Utensils,
  X,
} from "lucide-react";
import RoomAvailabilityCalendar from "./RoomAvailabilityCalendar";
import { amenityIcons, RoomDeal, RoomType } from "./booking-data";
import type { CartItem } from "./FloatingBookingCart";

type BookingRoomCardProps = {
  room: RoomType;
  nights: number;
  onAddToCart: (item: CartItem) => void;
};

type GuestPocketState = {
  open: boolean;
  deal: RoomDeal | null;
};

type DetailPocketState = {
  open: boolean;
  deal: RoomDeal | null;
};

export default function BookingRoomCard({
  room,
  nights,
  onAddToCart,
}: BookingRoomCardProps) {
  const [tab, setTab] = useState<"price" | "availability">("price");
  const [imageIndex, setImageIndex] = useState(0);

  const [detailPocket, setDetailPocket] = useState<DetailPocketState>({
    open: false,
    deal: null,
  });

  const [pocket, setPocket] = useState<GuestPocketState>({
    open: false,
    deal: null,
  });

  const [roomQuantity, setRoomQuantity] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [note, setNote] = useState("");

  const currentImage = room.gallery[imageIndex] || room.coverImage;
  const isFull = room.available <= 0;

  function nextImage() {
    if (room.gallery.length <= 0) return;
    setImageIndex((prev) => (prev + 1) % room.gallery.length);
  }

  function prevImage() {
    if (room.gallery.length <= 0) return;
    setImageIndex((prev) => (prev - 1 + room.gallery.length) % room.gallery.length);
  }

  function openDetailPocket(deal: RoomDeal) {
    setDetailPocket({
      open: true,
      deal,
    });
  }

  function closeDetailPocket() {
    setDetailPocket({
      open: false,
      deal: null,
    });
  }

  function openGuestPocket(deal: RoomDeal) {
    setRoomQuantity(1);
    setAdults(2);
    setChildren(0);
    setNote("");

    setPocket({
      open: true,
      deal,
    });
  }

  function closeGuestPocket() {
    setPocket({
      open: false,
      deal: null,
    });
  }

  function addGuestPocketToCart() {
    if (!pocket.deal) return;

    onAddToCart({
      cartId: `${room.id}-${pocket.deal.id}-${Date.now()}`,
      roomId: room.id,
      roomName: room.name,
      dealTitle: pocket.deal.title,
      quantity: roomQuantity,
      price: pocket.deal.price,
      adults,
      children,
      totalGuests: adults + children,
      note,
    } as CartItem);

    closeGuestPocket();
  }

  function increaseRoom() {
    setRoomQuantity((prev) => Math.min(prev + 1, room.available || 1));
  }

  function decreaseRoom() {
    setRoomQuantity((prev) => Math.max(prev - 1, 1));
  }

  function increaseAdults() {
    setAdults((prev) => Math.min(prev + 1, 12));
  }

  function decreaseAdults() {
    setAdults((prev) => Math.max(prev - 1, 1));
  }

  function increaseChildren() {
    setChildren((prev) => Math.min(prev + 1, 12));
  }

  function decreaseChildren() {
    setChildren((prev) => Math.max(prev - 1, 0));
  }

  return (
    <>
      <article
        id={room.id}
        className="scroll-mt-32 overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-green-950/8 md:scroll-mt-52 md:rounded-[36px]"
      >
        <div className="flex flex-col gap-0 xl:grid xl:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[260px] bg-slate-100 sm:min-h-[320px] xl:min-h-full">
            <Image
              src={currentImage}
              alt={room.name}
              fill
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/10" />

            <button
              type="button"
              className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/50 text-white backdrop-blur-xl md:left-5 md:top-5 md:h-12 md:w-12"
            >
              <Eye size={22} />
            </button>

            <button
              type="button"
              onClick={prevImage}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-black/40 text-white backdrop-blur-xl transition hover:bg-black/60 md:left-5 md:h-12 md:w-12"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-black/40 text-white backdrop-blur-xl transition hover:bg-black/60 md:right-5 md:h-12 md:w-12"
            >
              <ChevronRight size={24} />
            </button>

            <div className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5">
              <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-white backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#e97732] px-3 py-1 text-xs font-black">
                    เริ่ม ฿{room.priceStart.toLocaleString()} / คืน
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      isFull ? "bg-red-500" : "bg-green-600"
                    }`}
                  >
                    {isFull ? "เต็ม" : `ว่าง ${room.available} ห้อง`}
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-black leading-snug md:text-2xl">
                  {room.name}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-white/70 md:line-clamp-none">
                  {room.description}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#f8faf9]">
            <div className="grid grid-cols-3">
              <div className="bg-[#e97732] p-3 text-center text-white md:p-5">
                <p className="text-xs font-bold text-white/70">เริ่มต้น</p>
                <p className="mt-1 text-lg font-black md:text-2xl">
                  ฿{room.priceStart.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-white/70">ต่อคืน</p>
              </div>

              <div className="border-l border-white bg-[#eef2ef] p-3 text-center md:p-5">
                <UsersRound className="mx-auto text-slate-400" size={22} />
                <p className="mt-2 text-sm font-black text-[#1f3d2b] md:text-xl">
                  {room.capacityLabel}
                </p>
              </div>

              <div className="border-l border-white bg-[#eef2ef] p-3 text-center md:p-5">
                <BedDouble className="mx-auto text-slate-400" size={22} />
                <p className="mt-2 text-sm font-black text-[#1f3d2b]">
                  {room.bedLabel}
                </p>
              </div>
            </div>

            <div className="p-3 sm:p-5 md:p-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {room.amenities.slice(0, 6).map((amenity) => {
                  const Icon = amenityIcons[amenity.iconName];

                  return (
                    <div
                      key={amenity.label}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7f1e7] text-[#e97732]">
                        <Icon size={18} />
                      </span>

                      <span className="text-sm font-black text-[#1f3d2b]">
                        {amenity.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {room.highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-black text-green-700"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setTab("price")}
                  className={`shrink-0 rounded-t-2xl border px-4 py-3 text-sm font-black transition md:px-5 ${
                    tab === "price"
                      ? "border-slate-200 border-b-white bg-white text-[#1f3d2b]"
                      : "border-transparent text-slate-400 hover:text-[#1f3d2b]"
                  }`}
                >
                  เรทราคา
                </button>

                <button
                  type="button"
                  onClick={() => setTab("availability")}
                  className={`shrink-0 rounded-t-2xl border px-4 py-3 text-sm font-black transition md:px-5 ${
                    tab === "availability"
                      ? "border-slate-200 border-b-white bg-white text-[#1f3d2b]"
                      : "border-transparent text-slate-400 hover:text-[#1f3d2b]"
                  }`}
                >
                  สถานะห้องว่าง/ข้อมูลห้อง
                </button>
              </div>

              <div className="rounded-b-[28px] bg-white p-3 md:p-5">
                {tab === "price" ? (
                  <div className="grid gap-4">
                    {room.deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                      >
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {deal.badge && (
                                <span className="rounded-xl bg-[#16a34a] px-3 py-1 text-xs font-black text-white">
                                  {deal.badge}
                                </span>
                              )}

                              <h4 className="text-xl font-black text-[#1f3d2b]">
                                {deal.title}
                              </h4>
                            </div>

                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              {deal.description}
                            </p>

                            <ul className="mt-4 grid gap-2 text-sm font-semibold leading-6 text-slate-600">
                              {deal.policies.map((policy) => (
                                <li key={policy} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e97732]" />
                                  {policy}
                                </li>
                              ))}
                            </ul>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {deal.includes.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full bg-[#f7f1e7] px-3 py-2 text-xs font-black text-[#8b5e34]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => openDetailPocket(deal)}
                              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#e97732] bg-white px-4 py-2 text-sm font-black text-[#e97732] transition hover:bg-orange-50"
                            >
                              <Info size={16} />
                              รายละเอียด
                            </button>
                          </div>

                          <div className="rounded-3xl bg-[#fff8ec] p-4 text-center lg:min-w-[230px]">
                            {deal.originalPrice && (
                              <p className="text-sm font-bold text-slate-400 line-through">
                                ฿{deal.originalPrice.toLocaleString()} / คืน
                              </p>
                            )}

                            <p className="mt-1 text-sm font-black text-slate-500">
                              เริ่ม
                            </p>

                            <p className="text-3xl font-black text-[#e97732]">
                              ฿{deal.price.toLocaleString()}
                            </p>

                            <p className="text-sm font-bold text-slate-400">
                              / คืน
                            </p>

                            <button
                              type="button"
                              disabled={isFull}
                              onClick={() => openGuestPocket(deal)}
                              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition ${
                                isFull
                                  ? "cursor-not-allowed bg-slate-300"
                                  : "bg-[#e97732] hover:-translate-y-0.5 hover:bg-[#ff8b3d]"
                              }`}
                            >
                              {isFull ? "ห้องเต็ม" : "จองเลย"}
                              <ShoppingCart size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RoomAvailabilityCalendar
                    roomId={room.id}
                    roomName={room.shortName || room.name}
                    totalRooms={room.available}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {detailPocket.open && detailPocket.deal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[36px] bg-white shadow-2xl md:bottom-8 md:rounded-[36px]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/92 p-5 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e97732]">
                    Package Detail
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-[#1f3d2b]">
                    รายละเอียดแพ็กเกจ
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {room.name} / {detailPocket.deal.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetailPocket}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff8ec] text-[#1f3d2b] shadow-sm"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-5">
              <DealDetailPanel deal={detailPocket.deal} nights={nights} />
            </div>
          </div>
        </div>
      )}

      {pocket.open && pocket.deal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[36px] bg-[#fff8ec] shadow-2xl md:bottom-8 md:rounded-[36px]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#fff8ec]/90 p-5 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e97732]">
                    Guest Pocket
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-[#1f3d2b]">
                    เลือกผู้เข้าพัก
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {room.name} / {pocket.deal.title}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeGuestPocket}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1f3d2b] shadow-sm"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-[28px] bg-[#1f3d2b] p-5 text-white">
                <p className="text-sm font-bold text-white/60">ราคาต่อคืน</p>
                <div className="mt-1 flex items-end justify-between gap-4">
                  <p className="text-4xl font-black">
                    ฿{pocket.deal.price.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold text-white/60">
                    {nights} คืน
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <CounterBox
                  title="จำนวนห้อง"
                  description={`เลือกได้สูงสุด ${room.available} ห้อง`}
                  value={roomQuantity}
                  onDecrease={decreaseRoom}
                  onIncrease={increaseRoom}
                />

                <CounterBox
                  title="ผู้ใหญ่"
                  description="อายุ 13 ปีขึ้นไป"
                  value={adults}
                  onDecrease={decreaseAdults}
                  onIncrease={increaseAdults}
                />

                <CounterBox
                  title="เด็ก"
                  description="อายุต่ำกว่า 13 ปี"
                  value={children}
                  onDecrease={decreaseChildren}
                  onIncrease={increaseChildren}
                />
              </div>

              <label className="mt-5 block rounded-[28px] border border-slate-200 bg-white p-4">
                <span className="text-sm font-black text-[#1f3d2b]">
                  หมายเหตุเพิ่มเติม
                </span>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="เช่น ขอเต็นท์ใกล้กัน, มีเด็กเล็ก, ขอเซ็ตวันเกิด"
                  className="mt-3 w-full resize-none bg-transparent text-sm font-semibold text-slate-600 outline-none placeholder:text-slate-300"
                />
              </label>

              <div className="mt-5 rounded-[28px] border border-orange-100 bg-orange-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      รวมผู้เข้าพัก
                    </p>
                    <p className="mt-1 text-2xl font-black text-[#1f3d2b]">
                      {adults + children} คน
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-500">
                      ยอดรวมรายการนี้
                    </p>
                    <p className="mt-1 text-3xl font-black text-[#e97732]">
                      ฿
                      {(
                        pocket.deal.price *
                        roomQuantity *
                        nights
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={addGuestPocketToCart}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#e97732] px-6 py-5 text-base font-black text-white shadow-xl shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-[#ff8b3d]"
              >
                เพิ่มไปยังรถเข็น
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type CounterBoxProps = {
  title: string;
  description: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

function CounterBox({
  title,
  description,
  value,
  onDecrease,
  onIncrease,
}: CounterBoxProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[28px] border border-slate-200 bg-white p-4">
      <div>
        <p className="text-lg font-black text-[#1f3d2b]">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-400">
          {description}
        </p>
      </div>

      <div className="flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-[#fff8ec]">
        <button
          type="button"
          onClick={onDecrease}
          className="flex h-12 w-12 items-center justify-center text-[#1f3d2b]"
        >
          <Minus size={17} />
        </button>

        <div className="flex h-12 w-14 items-center justify-center border-x border-slate-200 text-lg font-black text-[#1f3d2b]">
          {value}
        </div>

        <button
          type="button"
          onClick={onIncrease}
          className="flex h-12 w-12 items-center justify-center text-[#1f3d2b]"
        >
          <Plus size={17} />
        </button>
      </div>
    </div>
  );
}

type DealDetailPanelProps = {
  deal: RoomDeal;
  nights: number;
};

function DealDetailPanel({ deal, nights }: DealDetailPanelProps) {
  const totalPrice = deal.price * nights;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-8 p-4 md:p-5">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <DollarSign size={22} className="text-slate-400" />
            <h6 className="text-lg font-black text-[#1f3d2b]">
              เรทราคาตามวัน
            </h6>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <div className="grid min-w-[360px] grid-cols-3 bg-sky-50 text-center text-sm font-black text-[#1f3d2b]">
              <div className="border-r border-white px-3 py-3">อ.</div>
              <div className="border-r border-white px-3 py-3">พ.</div>
              <div className="px-3 py-3">รวม</div>
            </div>

            <div className="grid min-w-[360px] grid-cols-3 bg-white text-center">
              <div className="border-r border-slate-100 px-3 py-4">
                <p className="text-sm font-semibold text-slate-400">
                  5 พ.ค.
                </p>
                <p className="mt-1 text-xl font-black text-[#1f3d2b] md:text-2xl">
                  {deal.price.toLocaleString()}
                </p>
              </div>

              <div className="border-r border-slate-100 px-3 py-4">
                <p className="text-sm font-semibold text-slate-400">
                  6 พ.ค.
                </p>
                <p className="mt-1 text-xl font-black text-[#1f3d2b] md:text-2xl">
                  {deal.price.toLocaleString()}
                </p>
              </div>

              <div className="px-3 py-4">
                <p className="text-sm font-semibold text-slate-400">
                  {nights} คืน
                </p>
                <p className="mt-1 text-xl font-black text-red-600 md:text-2xl">
                  ฿ {totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-end gap-3 text-xs font-black text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-sky-600" />
              วันสุดสัปดาห์
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-red-500" />
              วันหยุดยาว
            </span>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Utensils size={22} className="text-slate-400" />
            <h6 className="text-lg font-black text-[#1f3d2b]">มื้ออาหาร</h6>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 text-center text-sm font-black text-[#1f3d2b]">
              <div className="border-r border-slate-200 px-3 py-3">เช้า</div>
              <div className="border-r border-slate-200 px-3 py-3">
                กลางวัน
              </div>
              <div className="px-3 py-3">เย็น</div>
            </div>

            <div className="grid grid-cols-3 bg-white text-center">
              <div className="border-r border-slate-100 px-3 py-6">
                <Check className="mx-auto text-green-600" size={30} />
              </div>

              <div className="border-r border-slate-100 px-3 py-6">
                <X className="mx-auto text-red-500" size={30} />
              </div>

              <div className="px-3 py-6">
                <Check className="mx-auto text-green-600" size={30} />
              </div>
            </div>

            <div className="border-t border-slate-100 bg-white px-5 py-4">
              <ul className="grid gap-2 text-sm font-semibold leading-6 text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e97732]" />
                  อาหารเช้า ไม่เสิร์ฟในวันเช็คอิน
                </li>

                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e97732]" />
                  อาหารเย็น ไม่เสิร์ฟในวันเช็คเอาท์
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <LockKeyhole size={22} className="text-slate-400" />
            <h6 className="text-lg font-black text-[#1f3d2b]">
              มื้ออาหารบังคับ
            </h6>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 text-center text-sm font-black text-[#1f3d2b]">
              <div className="border-r border-slate-200 px-3 py-3">
                รายการ
              </div>

              <div className="border-r border-slate-200 px-3 py-3">
                ผู้ใหญ่
              </div>

              <div className="border-r border-slate-200 px-3 py-3">เด็ก</div>

              <div className="px-3 py-3">จำนวน</div>
            </div>

            <div className="px-3 py-8 text-center text-lg font-black text-slate-400">
              ไม่พบรายการ
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={22} className="text-slate-400" />
            <h6 className="text-lg font-black text-[#1f3d2b]">
              นโยบายและเงื่อนไข
            </h6>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <ul className="grid gap-3 text-sm font-semibold leading-6 text-slate-700">
              {deal.policies.map((policy) => (
                <li key={policy} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e97732]" />
                  {policy}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}