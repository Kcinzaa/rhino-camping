"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  CheckCircle2,
  Edit3,
  ImageIcon,
  Loader2,
  PawPrint,
  Plus,
  RefreshCcw,
  Save,
  Search,
  TentTree,
  X,
  XCircle,
} from "lucide-react";

type Room = {
  id: string;
  name: string;
  slug: string;
  category: string;
  capacity: number;
  unit_label: string;
  description: string;
  cover_image: string;
  gallery_images?: string[] | string | null;
  is_pet_allowed: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type ApiRoomsResponse = {
  rooms?: Room[];
  room?: Room;
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
};

const emptyRoom: Room = {
  id: "",
  name: "",
  slug: "",
  category: "TENT",
  capacity: 2,
  unit_label: "หลัง",
  description: "",
  cover_image: "",
  gallery_images: [],
  is_pet_allowed: false,
  is_active: true,
};

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [form, setForm] = useState<Room>(emptyRoom);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  function getToken() {
    if (typeof window === "undefined") return "admin-local-session";
    return localStorage.getItem("adminToken") || "admin-local-session";
  }

  async function loadRooms() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/rooms", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiRoomsResponse;

      if (!response.ok) {
        console.error("LOAD_ROOMS_ERROR_RESULT", result);
        alert(result.message || result.error || "โหลดข้อมูลห้องไม่สำเร็จ");
        return;
      }

      setRooms(Array.isArray(result.rooms) ? result.rooms : []);
    } catch (error) {
      console.error("LOAD_ROOMS_ERROR", error);
      alert("โหลดข้อมูลห้องไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function saveRoom() {
    if (!form.name.trim()) {
      alert("กรุณากรอกชื่อห้อง");
      return;
    }

    setSaving(true);

    try {
      const method = form.id ? "PATCH" : "POST";

      const payload = {
        ...form,
        slug: form.slug || makeSlug(form.name),
        capacity: Number(form.capacity || 1),
        gallery_images: parseGalleryImages(form.gallery_images),
      };

      const response = await fetch("/api/admin/rooms", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiRoomsResponse;

      if (!response.ok) {
        console.error("SAVE_ROOM_ERROR_RESULT", result);
        alert(result.message || result.error || "บันทึกข้อมูลห้องไม่สำเร็จ");
        return;
      }

      alert(form.id ? "อัปเดตห้องสำเร็จ" : "เพิ่มห้องใหม่สำเร็จ");
      setForm(emptyRoom);
      await loadRooms();
    } catch (error) {
      console.error("SAVE_ROOM_ERROR", error);
      alert("บันทึกข้อมูลห้องไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function editRoom(room: Room) {
    setForm({
      ...room,
      gallery_images: parseGalleryImages(room.gallery_images),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setForm(emptyRoom);
  }

  const filteredRooms = useMemo(() => {
    const key = keyword.trim().toLowerCase();

    if (!key) return rooms;

    return rooms.filter((room) => {
      return [
        room.name,
        room.slug,
        room.category,
        room.description,
        room.unit_label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(key);
    });
  }, [keyword, rooms]);

  const totalActive = rooms.filter((room) => room.is_active).length;
  const totalPet = rooms.filter((room) => room.is_pet_allowed).length;

  return (
    <div className="grid gap-7">
      <section
        className="relative overflow-hidden rounded-[42px] border p-7 md:p-9"
        style={{
          background:
            "linear-gradient(135deg, #101010 0%, #181818 56%, #321807 100%)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#ffffff",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-25 blur-3xl"
          style={{ background: UI.orange }}
        />

        <div className="relative grid gap-7 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em]"
              style={{
                background: "rgba(249,115,22,0.13)",
                color: UI.orange,
                border: "1px solid rgba(249,115,22,0.35)",
              }}
            >
              <TentTree size={16} />
              Rooms Management
            </div>

            <h1 className="mt-5 text-4xl font-black md:text-5xl">
              จัดการประเภทห้อง
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              เพิ่ม แก้ไขรูปภาพ รายละเอียด จำนวนคนที่รองรับ และสถานะเปิดขายของห้องพัก
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <HeroStat label="ทั้งหมด" value={rooms.length} />
            <HeroStat label="เปิดขาย" value={totalActive} />
            <HeroStat label="สัตว์เลี้ยงได้" value={totalPet} />
          </div>
        </div>
      </section>

      <section className="grid gap-7 xl:grid-cols-[430px_1fr]">
        <aside
          className="h-fit overflow-hidden rounded-[36px] border shadow-sm xl:sticky xl:top-24"
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
                "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
                style={{ background: form.id ? UI.orange : UI.black }}
              >
                {form.id ? <Edit3 size={26} /> : <Plus size={28} />}
              </div>

              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.2em]"
                  style={{ color: UI.orange }}
                >
                  {form.id ? "Edit Room" : "Create Room"}
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  {form.id ? "แก้ไขห้อง" : "เพิ่มห้องใหม่"}
                </h2>
                <p className="text-sm font-semibold" style={{ color: UI.muted }}>
                  ข้อมูลจะแสดงที่หน้าจอง
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5">
            <Input
              label="ชื่อห้อง"
              value={form.name}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  name: value,
                  slug: prev.slug ? prev.slug : makeSlug(value),
                }))
              }
              placeholder="เช่น ห้องกระโจม 2 ท่าน"
            />

            <Input
              label="Slug"
              value={form.slug}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  slug: value,
                }))
              }
              placeholder="เช่น tent-2"
            />

            <Select
              label="ประเภท"
              value={form.category}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  category: value,
                  unit_label: value === "TENT" ? "หลัง" : "ห้อง",
                }))
              }
              options={[
                { label: "ห้องกระโจม", value: "TENT" },
                { label: "ห้องรีสอร์ท", value: "RESORT" },
              ]}
            />

            <Input
              label="เข้าพักได้ / ห้อง"
              type="number"
              value={String(form.capacity)}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  capacity: Number(value || 1),
                }))
              }
              placeholder="2"
            />

            <Input
              label="หน่วย เช่น หลัง / ห้อง"
              value={form.unit_label}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  unit_label: value,
                }))
              }
              placeholder="หลัง"
            />

            <Input
              label="รูปหลัก เช่น /images/tent-2.jpg"
              value={form.cover_image}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  cover_image: value,
                }))
              }
              placeholder="/images/tent-2.jpg"
            />

            <TextArea
              label="รูปหลายรูป ใส่บรรทัดละรูป"
              value={parseGalleryImages(form.gallery_images).join("\n")}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  gallery_images: value,
                }))
              }
              placeholder={"/images/tent-2.jpg\n/images/tent-2-2.jpg"}
            />

            <TextArea
              label="รายละเอียด"
              value={form.description}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  description: value,
                }))
              }
              placeholder="รายละเอียดห้อง สิ่งอำนวยความสะดวก หรือคำอธิบาย"
            />

            <div className="grid gap-3">
              <CheckRow
                checked={form.is_pet_allowed}
                label="สัตว์เลี้ยงเข้าพักได้"
                icon={<PawPrint size={18} />}
                onChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    is_pet_allowed: checked,
                  }))
                }
              />

              <CheckRow
                checked={form.is_active}
                label="เปิดขายห้องนี้"
                icon={<CheckCircle2 size={18} />}
                onChange={(checked) =>
                  setForm((prev) => ({
                    ...prev,
                    is_active: checked,
                  }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <button
                type="button"
                onClick={saveRoom}
                disabled={saving}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white transition hover:scale-[1.02] disabled:opacity-60"
                style={{
                  background: UI.orange,
                  boxShadow: "0 14px 32px rgba(249,115,22,0.20)",
                }}
              >
                {saving ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Save size={20} />
                )}
                {form.id ? "บันทึกการแก้ไข" : "เพิ่มห้อง"}
              </button>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                    color: UI.black,
                  }}
                >
                  <X size={18} />
                  ยกเลิก
                </button>
              )}
            </div>
          </div>
        </aside>

        <section
          className="overflow-hidden rounded-[36px] border shadow-sm"
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
                "linear-gradient(135deg, #ffffff 0%, #fff7ed 58%, #ffffff 100%)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: UI.orange }}
                >
                  Room List
                </p>
                <h2 className="mt-2 text-3xl font-black">รายการห้องพัก</h2>
                <p className="mt-1 text-sm font-semibold" style={{ color: UI.muted }}>
                  คลิกแก้ไขเพื่อปรับข้อมูลห้อง
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label
                  className="flex h-12 w-full items-center gap-3 rounded-2xl border px-4 sm:min-w-[300px]"
                  style={{
                    background: UI.paper,
                    borderColor: UI.line,
                  }}
                >
                  <Search size={18} color={UI.orange} />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="ค้นหาชื่อห้อง / ประเภท"
                    className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-300"
                  />
                </label>

                <button
                  type="button"
                  onClick={loadRooms}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-black"
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
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="text-center">
                <Loader2
                  className="mx-auto animate-spin"
                  size={48}
                  color={UI.orange}
                />
                <p className="mt-4 text-2xl font-black">กำลังโหลดข้อมูลห้อง</p>
                <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
                  กรุณารอสักครู่
                </p>
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex min-h-[520px] items-center justify-center p-6 text-center">
              <div>
                <div
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: UI.orangeSoft, color: UI.orange }}
                >
                  <TentTree size={42} />
                </div>

                <h3 className="mt-5 text-3xl font-black">ยังไม่มีข้อมูลห้อง</h3>
                <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
                  เพิ่มห้องใหม่จากฟอร์มด้านซ้าย
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 p-5">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} room={room} onEdit={() => editRoom(room)} />
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white/10 p-5 backdrop-blur">
      <p className="text-sm font-black text-white/55">{label}</p>
      <p className="mt-2 text-4xl font-black" style={{ color: UI.orange }}>
        {value}
      </p>
    </div>
  );
}

function RoomCard({ room, onEdit }: { room: Room; onEdit: () => void }) {
  const gallery = parseGalleryImages(room.gallery_images);
  const image = room.cover_image || gallery[0] || "/images/tent-1.jpg";

  return (
    <article
      className="group overflow-hidden rounded-[32px] border transition hover:-translate-y-0.5 hover:shadow-xl"
      style={{
        background: UI.paper,
        borderColor: UI.line,
        boxShadow: "0 12px 42px rgba(15,23,42,0.04)",
      }}
    >
      <div className="grid gap-5 p-4 md:grid-cols-[180px_1fr_auto] md:items-center md:p-5">
        <div className="relative h-40 overflow-hidden rounded-[26px] bg-slate-200 md:h-36">
          {image ? (
            <Image
              src={image}
              alt={room.name}
              fill
              sizes="180px"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon color={UI.muted} />
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              label={room.is_active ? "เปิดขาย" : "ปิดขาย"}
              tone={room.is_active ? "green" : "red"}
            />

            <Badge
              label={room.category === "RESORT" ? "รีสอร์ท" : "กระโจม"}
              tone="orange"
            />

            {room.is_pet_allowed && <Badge label="สัตว์เลี้ยงได้" tone="green" />}
          </div>

          <h3 className="mt-4 text-2xl font-black md:text-3xl">{room.name}</h3>

          <p className="mt-2 text-sm font-semibold" style={{ color: UI.muted }}>
            slug: {room.slug || "-"}
          </p>

          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-7" style={{ color: UI.muted }}>
            {room.description || "ยังไม่มีรายละเอียด"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MiniTag icon={<BedDouble size={15} />} text={`${room.capacity} คน / ${room.unit_label || "ห้อง"}`} />
            <MiniTag icon={<ImageIcon size={15} />} text={`${gallery.length} รูปแกลเลอรี`} />
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white transition hover:scale-[1.02]"
          style={{
            background: UI.orange,
            boxShadow: "0 14px 32px rgba(249,115,22,0.18)",
          }}
        >
          <Edit3 size={18} />
          แก้ไข
        </button>
      </div>
    </article>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label>
      <p className="mb-2 text-sm font-black">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-2xl border px-4 text-sm font-bold outline-none transition focus:border-orange-400"
        style={{
          borderColor: UI.line,
          background: UI.paper,
        }}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label>
      <p className="mb-2 text-sm font-black">{label}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none transition focus:border-orange-400"
        style={{
          borderColor: UI.line,
          background: UI.paper,
        }}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label>
      <p className="mb-2 text-sm font-black">{label}</p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 w-full rounded-2xl border px-4 text-sm font-bold outline-none transition focus:border-orange-400"
        style={{
          borderColor: UI.line,
          background: UI.paper,
        }}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckRow({
  checked,
  label,
  icon,
  onChange,
}: {
  checked: boolean;
  label: string;
  icon: React.ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex min-h-13 cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4"
      style={{
        background: checked ? UI.orangeSoft : UI.paper,
        borderColor: checked ? "#fed7aa" : UI.line,
      }}
    >
      <span className="flex items-center gap-3 text-sm font-black">
        <span style={{ color: checked ? UI.orange : UI.muted }}>{icon}</span>
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-orange-500"
      />
    </label>
  );
}

function Badge({ label, tone }: { label: string; tone: "green" | "orange" | "red" }) {
  const style =
    tone === "green"
      ? { bg: UI.greenSoft, color: UI.green }
      : tone === "red"
      ? { bg: UI.redSoft, color: UI.red }
      : { bg: UI.orangeSoft, color: UI.orange };

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {tone === "green" ? <CheckCircle2 size={14} /> : tone === "red" ? <XCircle size={14} /> : <TentTree size={14} />}
      {label}
    </span>
  );
}

function MiniTag({ icon, text }: { icon: React.ReactNode; text: string }) {
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

function parseGalleryImages(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (!value) return [];

  try {
    const parsed = JSON.parse(String(value));

    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }

  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\wก-๙-]/g, "");
}