"use client";
import { useState } from "react";

// Small owner-side share helper: one-tap copy of a tribute's public link.
export default function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          if (navigator.share) {
            await navigator.share({ url });
            return;
          }
        } catch {
          return; // user dismissed the share sheet
        }
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      style={{
        border: "1px solid #E4D9C4",
        background: "#fff",
        borderRadius: 20,
        padding: "8px 14px",
        cursor: "pointer",
        fontFamily: "inherit",
        color: "#2C2520",
      }}
    >
      {done ? "Copied ✓" : "Copy link"}
    </button>
  );
}
