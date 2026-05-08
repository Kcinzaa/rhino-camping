"use client";

import Link from "next/link";
import { ShoppingCart, Trash2, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";

export type CartItem = {
  cartId: string;
  roomName: string;
  dealTitle: string;
  quantity: number;
  price: number;
  adults: number;
  children: number;
  totalGuests: number;
  note?: string;
};

type FloatingBookingCartProps = {
  items: CartItem[];
  nights: number;
  onRemove: (cartId: string) => void;
};

export default function FloatingBookingCart({
  items,
  nights,
  onRemove,
}: FloatingBookingCartProps) {
  const [open, setOpen] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity * nights,
    0
  );

  useEffect(() => {
    const checkoutPayload = {
      nights,
      items,
      total,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("camp_booking_cart", JSON.stringify(checkoutPayload));
  }, [items, nights, total]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#e97732] text-white shadow-2xl shadow-orange-950/30 transition hover:scale-105 md:bottom-8"
      >
        <ShoppingCart size={26} />

        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1f3d2b] px-2 text-xs font-black text-white ring-4 ring-[#f7f1e7]">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-[#fff8ec] shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-[#fff8ec]/90 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e97732]">
                    Booking Cart
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-[#1f3d2b]">
                    รถเข็นการจอง
                  </h3>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1f3d2b]"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="p-5">
              {items.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center">
                  <ShoppingCart className="mx-auto text-slate-300" size={44} />

                  <p className="mt-4 text-lg font-black text-[#1f3d2b]">
                    ยังไม่มีรายการจอง
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    กด “จองเลย” แล้วเลือกจำนวนผู้เข้าพักเพื่อเพิ่มเข้ารถเข็น
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {items.map((item) => (
                    <div
                      key={item.cartId}
                      className="rounded-[28px] border border-white bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-black text-[#1f3d2b]">
                            {item.roomName}
                          </h4>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.dealTitle}
                          </p>
                        </div>

                        <button
                          onClick={() => onRemove(item.cartId)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#f7f1e7] p-3">
                        <UsersRound size={18} className="text-[#e97732]" />

                        <p className="text-sm font-black text-[#1f3d2b]">
                          ผู้เข้าพัก {item.totalGuests} คน
                        </p>

                        <p className="text-xs font-bold text-slate-400">
                          ผู้ใหญ่ {item.adults} / เด็ก {item.children}
                        </p>
                      </div>

                      {item.note && (
                        <div className="mt-3 rounded-2xl bg-orange-50 p-3 text-sm font-semibold text-[#8b5e34]">
                          หมายเหตุ: {item.note}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-2xl bg-[#f7f1e7] p-3">
                          <p className="text-xs font-bold text-slate-400">
                            จำนวนห้อง
                          </p>
                          <p className="font-black text-[#1f3d2b]">
                            {item.quantity}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-[#f7f1e7] p-3">
                          <p className="text-xs font-bold text-slate-400">
                            จำนวนคืน
                          </p>
                          <p className="font-black text-[#1f3d2b]">{nights}</p>
                        </div>

                        <div className="rounded-2xl bg-[#f7f1e7] p-3">
                          <p className="text-xs font-bold text-slate-400">
                            รวม
                          </p>
                          <p className="font-black text-[#e97732]">
                            ฿
                            {(
                              item.price *
                              item.quantity *
                              nights
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 rounded-[28px] bg-[#1f3d2b] p-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-white/60">
                    ยอดรวมทั้งหมด
                  </span>

                  <span className="text-3xl font-black">
                    ฿{total.toLocaleString()}
                  </span>
                </div>

                {items.length > 0 ? (
                  <Link
                    href="/booking/checkout"
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#e97732] px-5 py-4 text-sm font-black text-white transition hover:bg-[#ff8b3d]"
                  >
                    ไปหน้าชำระเงิน
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-5 w-full rounded-2xl bg-white/20 px-5 py-4 text-sm font-black text-white/50"
                  >
                    ไปหน้าชำระเงิน
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}