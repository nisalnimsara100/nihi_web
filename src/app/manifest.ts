import type { MetadataRoute } from "next";

/** Lets NiHi be installed on a phone's home screen and opened like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NiHi",
    short_name: "NiHi",
    description: "A simple personal finance tracker for your accounts, spending and income.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New transaction", short_name: "Add", url: "/transactions/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Scan a receipt", short_name: "Scan", url: "/transactions/new?scan=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
