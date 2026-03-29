import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#8E7A6B",
        borderRadius: "5px",
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: 20,
          fontWeight: 400,
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          marginTop: "-2px",
        }}
      >
        N
      </span>
    </div>,
    { ...size },
  );
}
