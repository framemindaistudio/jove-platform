import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or per-person pages: the internal portal, APIs, the cart, individual certificate lookups and papers sent to sign.
        disallow: ["/hq", "/api", "/cart", "/verify/", "/papers/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
