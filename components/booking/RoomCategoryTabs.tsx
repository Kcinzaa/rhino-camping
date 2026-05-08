"use client";

import { categoryTabs } from "./booking-data";
import { Check, ChevronRight } from "lucide-react";

type RoomCategoryTabsProps = {
  selectedRoomTypes: string[];
  onChange: (value: string[]) => void;
};

export default function RoomCategoryTabs({
  selectedRoomTypes,
  onChange,
}: RoomCategoryTabsProps) {
  function toggleType(id: string) {
    if (selectedRoomTypes.includes(id)) {
      onChange(selectedRoomTypes.filter((item) => item !== id));
      return;
    }

    onChange([...selectedRoomTypes, id]);
  }

  return (
    <div className="camp-container py-6">
      <div className="hide-scrollbar flex items-center gap-3 overflow-x-auto">
        <span className="flex shrink-0 items-center gap-1 text-sm font-black text-slate-400">
          ข้ามไป
          <ChevronRight size={16} />
        </span>

        <button
          onClick={() => onChange([])}
          className={`shrink-0 rounded-2xl border px-4 py-3 text-sm font-black transition ${
            selectedRoomTypes.length === 0
              ? "border-[#1f3d2b] bg-[#1f3d2b] text-white shadow-lg shadow-green-950/14"
              : "border-white bg-white text-[#1f3d2b] hover:border-[#1f3d2b]/20"
          }`}
        >
          ทั้งหมด
        </button>

        {categoryTabs.map((tab) => {
          const isActive = selectedRoomTypes.includes(tab.id);
          const isFull = tab.available <= 0;

          return (
            <button
              key={tab.id}
              onClick={() => toggleType(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
                isActive
                  ? "border-[#1f3d2b] bg-[#1f3d2b] text-white shadow-lg shadow-green-950/14"
                  : "border-white bg-white text-[#1f3d2b] hover:border-[#1f3d2b]/20"
              }`}
            >
              {isActive && <Check size={16} />}
              <span>{tab.label}</span>
              <span
                className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-black text-white ${
                  isFull ? "bg-red-500" : "bg-green-600"
                }`}
              >
                {tab.available}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}