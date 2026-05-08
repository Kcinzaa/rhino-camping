# Rhino Camping

ระบบจองที่พักสำหรับ Rhino Camp ที่ออกแบบให้ลูกค้าใช้งานผ่านมือถือเป็นหลัก พร้อมระบบจัดการรายการจอง อัปโหลดสลิป ตรวจสอบห้องว่าง และเชื่อมข้อมูลห้องกับฐานข้อมูลกลาง Supabase

## Features

- หน้า `booking` สำหรับเลือกวันเข้าพัก ดูห้องว่าง ราคา และเพิ่มรายการลงรถเข็น
- หน้า `checkout` สำหรับกรอกข้อมูลผู้จอง ยืนยันเงื่อนไข และสร้างรายการจอง
- หน้า `manage` สำหรับลูกค้าตรวจสอบสถานะรายการจองและอัปโหลดสลิป
- ระบบ LINE LIFF สำหรับระบุตัวตนผู้ใช้
- ระบบ Admin สำหรับตรวจสอบรายการจองและจัดการข้อมูลหลังบ้าน
- เชื่อม Supabase เป็นฐานข้อมูลกลางร่วมกับระบบ Gorilla Resort
- รองรับ mobile-first UI พร้อม popup, cart drawer และ animation

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- Prisma
- LINE LIFF

## Getting Started

ติดตั้ง dependencies:

```bash
npm install
```

สร้างไฟล์ `.env.local` และใส่ค่าที่จำเป็น:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

NEXT_PUBLIC_LIFF_ID=
NEXT_PUBLIC_ADMIN_LOCAL_TOKEN=

GORILLA_BASE_URL=
GORILLA_AVAILABILITY_SECRET=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
```

รัน dev server:

```bash
npm run dev
```

เปิดเว็บ:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Deployment

โปรเจกต์นี้สามารถ deploy บน Vercel ได้โดยตรง หลังจาก push ขึ้น GitHub แล้วให้ตั้งค่า Environment Variables บน Vercel ให้ครบตาม `.env.local`

สำคัญ: ห้าม commit ไฟล์ `.env` หรือ `.env.local` ขึ้น GitHub

## Main Routes

- `/booking` - หน้าจองที่พัก
- `/checkout` - หน้ากรอกข้อมูลและยืนยันการจอง
- `/manage` - หน้าจัดการรายการจองของลูกค้า
- `/admin/dashboard` - หน้า Admin Dashboard

## Notes

ระบบนี้ใช้ฐานข้อมูลกลางร่วมกับ Gorilla Resort ดังนั้นค่าการเชื่อมต่อ Supabase และ URL สำหรับตรวจสอบห้องว่างข้ามระบบต้องตั้งให้ตรงกันทั้งฝั่ง Rhino และ Gorilla
