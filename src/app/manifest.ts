import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JOVE — Journey of Visionation & Excellence",
    short_name: "JOVE",
    description: "Robotics & AI workshops for schools · JOVE HQ",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F1E8",
    theme_color: "#2B2B2B",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
