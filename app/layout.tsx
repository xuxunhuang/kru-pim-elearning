import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kru Pim - E-learning", template: "%s | Kru Pim - E-learning" },
  description: "พื้นที่เรียนออนไลน์ส่วนตัวของนักเรียนครูพิม",
  applicationName: "Kru Pim - E-learning",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
