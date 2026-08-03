import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/about", "/privacy", "/terms"], disallow: ["/admin", "/learn", "/api"] },
    ],
    sitemap: "https://krupim-mathlearning.pages.dev/sitemap.xml",
  };
}