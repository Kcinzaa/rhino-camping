"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, TentTree, X } from "lucide-react";
import { categoryTabs } from "./booking-data";

type BookingSearchPanelProps = {
  checkIn: string;
  nights: number;
  selectedRoomTypes: string[];
  onCheckInChange: (value: string) => void;
  onNightsChange: (value: number) => void;
  onSelectedRoomTypesChange: (value: string[]) => void;
};

export default function BookingSearchPanel({
  checkIn,
  nights,
  selectedRoomTypes,
  onCheckInChange,
  onNightsChange,
  onSelectedRoomTypesChange,
}: BookingSearchPanelProps) {
  const [open, setOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(() => {
    if (selectedRoomTypes.length === 0) return "ประเภทห้อง (5)";

    if (selectedRoomTypes.length === 1) {
      return (
        categoryTabs.find((item) => item.id === selectedRoomTypes[0])?.label ||
        "ประเภทห้อง (5)"
      );
    }

    return `เลือกแล้ว ${selectedRoomTypes.length} ประเภท`;
  }, [selectedRoomTypes]);

  const formattedCheckIn = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${checkIn}T00:00:00`));

  function openDatePicker() {
    const input = dateInputRef.current;

    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  }

  function toggleRoomType(id: string) {
    if (selectedRoomTypes.includes(id)) {
      onSelectedRoomTypesChange(
        selectedRoomTypes.filter((item) => item !== id)
      );
      return;
    }

    onSelectedRoomTypesChange([...selectedRoomTypes, id]);
  }

  return (
    <section className="relative z-20 border-b border-white/80 bg-[#f7f1e7]/95 py-3 backdrop-blur-2xl md:py-5">
      <div className="camp-container">
        <div className="mx-auto max-w-3xl rounded-2xl border border-orange-100 bg-white/92 p-3 shadow-lg shadow-green-950/8 backdrop-blur-xl sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[1.15fr_0.68fr_1.25fr] sm:items-center">
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={openDatePicker}
                className="group flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-[#fff8ec] px-4 py-3 text-left transition hover:border-[#e97732] focus:border-[#e97732] focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                <span className="shrink-0 text-sm font-black text-[#1f3d2b]">
                  เช็คอิน:
                </span>

                <span className="min-w-0 flex-1 truncate text-base font-black text-[#1f3d2b]">
                  {formattedCheckIn}
                </span>

                <CalendarDays size={19} className="shrink-0 text-[#e97732]" />
              </button>

              <input
                ref={dateInputRef}
                type="date"
                value={checkIn}
                onChange={(event) => onCheckInChange(event.target.value)}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                aria-label="เลือกวันเช็คอิน"
                tabIndex={-1}
              />
            </div>

            <label className="group flex min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-[#fff8ec] transition hover:border-[#e97732] focus-within:border-[#e97732] focus-within:ring-4 focus-within:ring-orange-100">
              <select
                value={nights}
                onChange={(event) => onNightsChange(Number(event.target.value))}
                className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent px-4 py-3 text-base font-black text-[#1f3d2b] outline-none"
                aria-label="เลือกจำนวนคืน"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
                <option value={7}>7</option>
              </select>

              <span className="flex shrink-0 items-center px-1 text-base font-black text-[#1f3d2b]">
                คืน
              </span>

              <span className="flex w-11 shrink-0 items-center justify-center bg-[#f7f1e7] text-[#e97732]">
                <ChevronDown size={18} />
              </span>
            </label>

            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex w-full min-w-0 items-center overflow-hidden rounded-2xl border border-slate-200 bg-[#fff8ec] text-left transition hover:border-[#e97732] focus:border-[#e97732] focus:outline-none focus:ring-4 focus:ring-orange-100"
              >
                <span className="min-w-0 flex-1 truncate px-4 py-3 text-base font-black text-[#1f3d2b]">
                  {selectedLabel}
                </span>

                <span className="flex w-11 shrink-0 items-center justify-center self-stretch bg-[#f7f1e7] text-[#e97732]">
                  <ChevronDown
                    size={18}
                    className={`transition ${open ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {open && (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white bg-white shadow-2xl shadow-green-950/16 md:absolute md:left-0 md:right-0 md:top-full md:z-50">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
                    <p className="text-sm font-black text-[#1f3d2b]">
                      เลือกประเภทห้อง
                    </p>

                    <button
                      type="button"
                      onClick={() => onSelectedRoomTypesChange([])}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-500"
                    >
                      <X size={14} />
                      ล้าง
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {categoryTabs.map((item) => {
                      const checked = selectedRoomTypes.includes(item.id);
                      const isFull = item.available <= 0;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleRoomType(item.id)}
                          className={`mb-2 flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition last:mb-0 ${
                            checked
                              ? "border-[#1f3d2b] bg-green-50"
                              : "border-slate-100 bg-white hover:bg-[#fff8ec]"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                checked
                                  ? "bg-[#1f3d2b] text-white"
                                  : "bg-[#f7f1e7] text-[#1f3d2b]"
                              }`}
                            >
                              {checked ? (
                                <Check size={17} />
                              ) : (
                                <TentTree size={17} />
                              )}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[#1f3d2b]">
                                {item.label}
                              </p>

                              <p className="text-xs font-semibold text-slate-400">
                                {isFull
                                  ? "ห้องเต็ม"
                                  : `ว่าง ${item.available} ห้อง`}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-black text-white ${
                              isFull ? "bg-red-500" : "bg-green-600"
                            }`}
                          >
                            {item.available}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}