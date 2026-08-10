import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Real Bengal Sweets — Management System",
    short_name: "RBS Management",
    description: "Operations dashboard for Real Bengal Sweets: orders, inventory, billing, payroll, and more.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#f4f6f9",
    theme_color: "#a9631a",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
