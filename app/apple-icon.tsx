import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#8E7A6B",
        borderRadius: "40px",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 108,
          fontWeight: 400,
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          marginTop: "-8px",
        }}
      >
        N
      </span>
    </div>,
    { ...size },
  );
}
