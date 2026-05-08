"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, TentTree, UserRound } from "lucide-react";

const UI = {
  page: "#f6efe5",
  paper: "#ffffff",
  black: "#101010",
  orange: "#f97316",
  line: "#e8ddd0",
  muted: "#64748b",
};

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function login() {
    if (!username.trim() || !password.trim()) {
      alert("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "เข้าสู่ระบบไม่สำเร็จ");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("adminToken", result.token);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error(error);
      alert("เข้าสู่ระบบไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(circle at top left, #fff7ed 0%, #f6efe5 45%, #111111 46%, #101010 100%)",
      }}
    >
      <section
        className="w-full max-w-md overflow-hidden rounded-[38px] border shadow-2xl"
        style={{
          background: UI.paper,
          borderColor: UI.line,
        }}
      >
        <div
          className="p-7 text-white"
          style={{
            background:
              "linear-gradient(135deg, #101010 0%, #1d1d1d 60%, #351806 100%)",
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: UI.orange }}
          >
            <TentTree size={32} />
          </div>

          <p
            className="mt-6 text-xs font-black uppercase tracking-[0.28em]"
            style={{ color: UI.orange }}
          >
            Admin Login
          </p>

          <h1 className="mt-2 text-4xl font-black">Rhino Admin</h1>

          <p className="mt-2 text-sm font-semibold text-white/55">
            เข้าสู่ระบบเพื่อจัดการรายการจอง ห้องพัก และการชำระเงิน
          </p>
        </div>

        <div className="grid gap-5 p-7">
          <label>
            <p className="mb-2 text-sm font-black">ชื่อผู้ใช้</p>
            <div
              className="flex h-14 items-center gap-3 rounded-2xl border px-4"
              style={{ borderColor: UI.line }}
            >
              <UserRound size={19} color={UI.orange} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
                placeholder="admin"
              />
            </div>
          </label>

          <label>
            <p className="mb-2 text-sm font-black">รหัสผ่าน</p>
            <div
              className="flex h-14 items-center gap-3 rounded-2xl border px-4"
              style={{ borderColor: UI.line }}
            >
              <LockKeyhole size={19} color={UI.orange} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm font-bold outline-none"
                placeholder="กรอกรหัสผ่าน"
                onKeyDown={(event) => {
                  if (event.key === "Enter") login();
                }}
              />
            </div>
          </label>

          <button
            type="button"
            onClick={login}
            disabled={submitting}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl text-sm font-black text-white disabled:opacity-60"
            style={{ background: UI.orange }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                กำลังเข้าสู่ระบบ
              </>
            ) : (
              <>
                <LockKeyhole size={20} />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}