import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NextBazar — Buy & Sell Anything in Cyprus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #faf9f7 0%, #f0eeeb 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: "#8E7A6B",
        }}
      />

      {/* Logo + Brand */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: -2,
          }}
        >
          NextBazar
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#6b6560",
            fontWeight: 400,
          }}
        >
          Buy & Sell Anything in Cyprus
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 16,
          }}
        >
          {["Vehicles", "Property", "Electronics", "Fashion"].map((cat) => (
            <div
              key={cat}
              style={{
                padding: "8px 20px",
                background: "#8E7A6B",
                color: "white",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 18,
          color: "#8a8280",
        }}
      >
        AI-Powered Marketplace &middot; Instant Messaging &middot; Trusted
        Sellers
      </div>
    </div>,
    { ...size },
  );
}
