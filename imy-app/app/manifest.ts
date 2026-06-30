import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "I Miss You Memorial",
    short_name: "I Miss You",
    description: "A beautiful place for the people we love.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF5EC",
    theme_color: "#A87C5F",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
