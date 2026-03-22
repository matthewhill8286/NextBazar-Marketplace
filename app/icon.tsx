import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "7px",
        }}
      >
        {/* Shine overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
            borderRadius: "7px 7px 0 0",
            display: "flex",
          }}
        />
        <span
          style={{
            color: "white",
            fontSize: 20,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-1px",
            lineHeight: 1,
            marginTop: "-2px",
          }}
        >
          N
        </span>
      </div>
    ),
    { ...size },
  );
}
