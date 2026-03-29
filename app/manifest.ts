import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NextBazar — Buy & Sell Anything in Cyprus",
    short_name: "NextBazar",
    description:
      "The smarter marketplace. AI-powered search, instant messaging, and trusted sellers.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#8E7A6B",
    orientation: "portrait-primary",
    categories: ["shopping", "marketplace", "classifieds"],
    icons: [
      {
        src: "/favicon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
