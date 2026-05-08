import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "Rhino Camping",
  description: "Glamping & Nature Resort Booking System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}