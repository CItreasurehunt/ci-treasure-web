import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CI Treasure Hunt",
    short_name: "CI Treasure Hunt",
    description:
      "A living map of contact improvisation events, communities, teachers & venues worldwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8fd",
    theme_color: "#faf8fd",
    icons: [
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
    ],
  };
}
