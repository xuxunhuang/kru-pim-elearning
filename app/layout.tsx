import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kru Pim - E-learning", template: "%s | Kru Pim - E-learning" },
  description: "พื้นที่เรียนออนไลน์ส่วนตัวของนักเรียนครูพิม",
  applicationName: "Kru Pim - E-learning",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#d94f88" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
