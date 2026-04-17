import { ImageResponse } from "next/og";
import { getListingBySlugCached } from "@/lib/supabase/queries";

export const runtime = "edge";
export const alt = "Listing on NextBazar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ListingOGImage(
  props: PageProps<"/[locale]/listing/[slug]">,
) {
  const { slug } = await props.params;
  const listing = await getListingBySlugCached(slug);

  if (!listing) {
    // Fallback: generic branded card
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #faf9f7 0%, #f0eeeb 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#1a1a1a",
          }}
        >
          NextBazar
        </div>
      </div>,
      { ...size },
    );
  }

  const category =
    listing.categories && !Array.isArray(listing.categories)
      ? listing.categories
      : null;

  const price =
    listing.price !== null
      ? `${listing.currency === "EUR" ? "\u20AC" : listing.currency}${listing.price.toLocaleString()}`
      : "Contact for price";

  const condition = listing.condition
    ? listing.condition
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #faf9f7 0%, #f0eeeb 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
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

      {/* Left side: listing image */}
      <div
        style={{
          width: listing.primary_image_url ? "50%" : "0%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {listing.primary_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.primary_image_url}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      {/* Right side: listing info */}
      <div
        style={{
          width: listing.primary_image_url ? "50%" : "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: listing.primary_image_url
            ? "48px 48px 48px 40px"
            : "48px 80px",
          gap: 16,
        }}
      >
        {/* Category + condition badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {category && (
            <div
              style={{
                padding: "4px 12px",
                background: "#8E7A6B",
                color: "white",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              {category.name}
            </div>
          )}
          {condition && (
            <div
              style={{
                padding: "4px 12px",
                background: "#f0eeeb",
                color: "#6b6560",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {condition}
            </div>
          )}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: listing.title.length > 50 ? 28 : 36,
            fontWeight: 700,
            color: "#1a1a1a",
            lineHeight: 1.2,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {listing.title}
        </div>

        {/* Price */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#8E7A6B",
            marginTop: 4,
          }}
        >
          {price}
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {listing.is_promoted && (
            <div
              style={{
                padding: "4px 10px",
                background: "#fef3c7",
                color: "#92400e",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Featured
            </div>
          )}
          {listing.is_urgent && (
            <div
              style={{
                padding: "4px 10px",
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Urgent
            </div>
          )}
        </div>
      </div>

      {/* Bottom brand bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 48,
          background: "rgba(26, 26, 26, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>
          NextBazar
        </div>
        <div style={{ fontSize: 14, color: "#a8a4a0" }}>
          Buy & Sell in Cyprus
        </div>
      </div>
    </div>,
    { ...size },
  );
}
