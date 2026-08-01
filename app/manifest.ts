import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kru Pim E-learning",
    short_name: "Kru Pim",
    description: "พื้นที่เรียนออนไลน์ส่วนตัวของนักเรียนครูพิม",
    start_url: "/learn",
    display: "standalone",
    background_color: "#fffafc",
    theme_color: "#d94f88",
    icons: [
      { src: "/rabbit-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/rabbit-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
