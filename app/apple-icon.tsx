import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
          borderRadius: "40px",
        }}
      >
        {/* Shine strip */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "35%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 100%)",
            borderRadius: "40px 40px 0 0",
            display: "flex",
          }}
        />

        {/* N letter */}
        <span
          style={{
            color: "white",
            fontSize: 108,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-5px",
            lineHeight: 1,
            marginTop: "-8px",
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size },
  );
}
