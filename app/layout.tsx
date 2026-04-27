import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lite Shipping Trip Logs",
  description: "MVP for vessel trip operations and fuel tracking"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
