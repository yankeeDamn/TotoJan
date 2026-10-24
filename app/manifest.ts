import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TotoJan",
    short_name: "TotoJan",
    description: "Book a Toto or cab from Rampurhat to Tarapith.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f1",
    theme_color: "#d9560b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
