import type { MetadataRoute } from "next";
import { SITE_URL } from "./layout";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The questions and the API are not search landing pages.
      disallow: ["/assessment", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
