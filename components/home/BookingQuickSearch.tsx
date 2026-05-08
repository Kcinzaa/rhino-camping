"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Moon,
  Search,
  UsersRound,
} from "lucide-react";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BookingQuickSearch() {
  const [checkIn, setCheckIn] = useState(() => toDateInputValue(new Date()));
  const [nights, setNights] = useState("1");
  const [guests, setGuests] = useState("2");
  const [roomType, setRoomType] = useState("all");

  const params = new URLSearchParams({
    checkIn,
    nights,
    guests,
    roomType,
  });

  return (
    <section className="camp-gradient py-16">
      <div className="camp-container">
        <div className="rounded-[36px] border border-white/80 bg-white/78 p-5 shadow-2xl shadow-green-950/10 backdrop-blur-xl md:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#e97732]">
                Quick Booking
              </p>
              <h2 className="mt-2 text-3xl font-black text-[#1f3d2b]">
                ค้นหาที่พักว่าง
              </h2>
            </div>

            <p className="max-w-xl text-sm font-semibold leading-7 text-slate-500">
              เลือกวันเข้าพัก จำนวนคืน จำนวนผู้เข้าพัก และประเภทที่พัก
              เพื่อไปยังหน้าจองแบบละเอียด
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr_0.7fr_1fr_auto]">
            <label className="group rounded-3xl border border-slate-100 bg-[#fff8ec] p-4 transition focus-within:border-[#e97732]">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <CalendarDays size={15} />
                Check-in
              </span>
              <input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="mt-3 w-full bg-transparent text-lg font-black text-[#1f3d2b] outline-none"
              />
            </label>

            <label className="rounded-3xl border border-slate-100 bg-[#fff8ec] p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <Moon size={15} />
                Nights
              </span>
              <select
                value={nights}
                onChange={(event) => setNights(event.target.value)}
                className="mt-3 w-full appearance-none bg-transparent text-lg font-black text-[#1f3d2b] outline-none"
              >
                <option value="1">1 คืน</option>
                <option value="2">2 คืน</option>
                <option value="3">3 คืน</option>
                <option value="4">4 คืน</option>
                <option value="5">5 คืน</option>
              </select>
            </label>

            <label className="rounded-3xl border border-slate-100 bg-[#fff8ec] p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <UsersRound size={15} />
                Guests
              </span>
              <select
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="mt-3 w-full appearance-none bg-transparent text-lg font-black text-[#1f3d2b] outline-none"
              >
                <option value="1">1 คน</option>
                <option value="2">2 คน</option>
                <option value="3">3 คน</option>
                <option value="4">4 คน</option>
                <option value="5">5 คน</option>
                <option value="6">6 คนขึ้นไป</option>
              </select>
            </label>

            <label className="relative rounded-3xl border border-slate-100 bg-[#fff8ec] p-4">
              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <ChevronDown size={15} />
                Room Type
              </span>
              <select
                value={roomType}
                onChange={(event) => setRoomType(event.target.value)}
                className="mt-3 w-full appearance-none bg-transparent text-lg font-black text-[#1f3d2b] outline-none"
              >
                <option value="all">ทุกประเภท</option>
                <option value="tent-2p">เต็นท์ 2 ท่าน</option>
                <option value="tent-4p">เต็นท์ 4 ท่าน</option>
                <option value="dome-vip">โดม VIP</option>
                <option value="cabin">บ้านพักแคมป์</option>
              </select>
            </label>

            <Link
              href={`/booking?${params.toString()}`}
              className="flex items-center justify-center gap-2 rounded-3xl bg-[#1f3d2b] px-8 py-5 text-base font-black text-white shadow-xl shadow-green-950/18 transition hover:-translate-y-1 hover:bg-[#2e5a3f]"
            >
              ค้นหา
              <Search size={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
