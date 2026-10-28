import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0a0e17",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#aee028",
          }}
        >
          {BRAND.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 86,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#f4f6fb",
          }}
        >
          How ready are you, really?
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 34,
            color: "#8b93a6",
          }}
        >
          3 forces &middot; 9 questions &middot; 90 seconds
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            height: 10,
            width: 240,
            borderRadius: 999,
            backgroundColor: "#c4f53b",
          }}
        />
      </div>
    ),
    size,
  );
}
