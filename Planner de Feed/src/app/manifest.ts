import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Postaí — Feed com IA",
    short_name: "Postaí",
    description: "Joga as fotos. A Ami edita, organiza e agenda. Você só aprova.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0a14",
    theme_color: "#c084fc",
    categories: ["photo", "social", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  };
}
