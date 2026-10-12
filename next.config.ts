import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

/**
 * The prices customers pay are set in HQ → Money → Prices & Costs and saved in the private data repository
 * (data/pricebook.json → "published"). Each build reads that part and bakes it into the site as JOVE_PRICEBOOK
 * (see src/lib/content/business.ts). Nothing else from the price book is read here: costs and margins never
 * reach the website's code.
 */
function publishedPart(json: string) {
  let published: unknown;
  try {
    published = JSON.parse(json)?.published;
  } catch {
    throw new Error("data/pricebook.json is not valid JSON, so the site cannot be built with the saved prices.");
  }
  return published && typeof published === "object" ? JSON.stringify(published) : "";
}

async function savedPrices(): Promise<string> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (repo && token) {
    const branch = process.env.GITHUB_BRANCH || "main";
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/data/pricebook.json?ref=${encodeURIComponent(branch)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "jove-platform-build" },
      cache: "no-store",
    });
    if (res.status === 404) return ""; // no price book saved yet: the starting prices in business.ts apply
    // stopping here keeps the previous deployment live, instead of publishing the site with the wrong prices
    if (!res.ok) throw new Error(`Could not read the price book from ${repo} (GitHub answered ${res.status}). Check GITHUB_TOKEN and GITHUB_REPO.`);
    return publishedPart(await res.text());
  }
  // no data repository configured (a local copy): read the file from disk
  const file = path.join(process.cwd(), "data", "pricebook.json");
  return fs.existsSync(file) ? publishedPart(fs.readFileSync(file, "utf8")) : "";
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85, 90],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/hq/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "strict-origin" },
        ],
      },
      // Pages analytics never measures (src/lib/analytics.ts) also keep their address out of the Referer they send on.
      { source: "/labs/:slug", headers: [{ key: "Referrer-Policy", value: "strict-origin" }] },
      { source: "/verify/:code", headers: [{ key: "Referrer-Policy", value: "strict-origin" }] },
      {
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default async function config(): Promise<NextConfig> {
  return { ...nextConfig, env: { JOVE_PRICEBOOK: await savedPrices() } };
}
