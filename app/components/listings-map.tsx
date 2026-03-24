"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

// Fix Leaflet's default icon path issue with bundlers
// biome-ignore lint/suspicious/noExplicitAny: Leaflet internal
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type MapLocation = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  count: number;
};

type Props = {
  locations: MapLocation[];
  selectedSlug?: string;
  onSelectLocation: (slug: string) => void;
};

export default function ListingsMap({
  locations,
  selectedSlug,
  onSelectLocation,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [35.1264, 33.4299], // Cyprus
      zoom: 8,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers whenever locations or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => {
      m.remove();
    });

    markersRef.current = [];

    locations.forEach((loc) => {
      const isSelected = loc.slug === selectedSlug;

      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: Math.max(14, Math.min(30, 12 + Math.sqrt(loc.count) * 2)),
        fillColor: isSelected ? "#4F46E5" : "#6366F1",
        color: isSelected ? "#3730A3" : "#4F46E5",
        weight: isSelected ? 3 : 1.5,
        fillOpacity: isSelected ? 0.95 : 0.75,
      }).addTo(map);

      // Label inside the circle
      const label = L.divIcon({
        className: "",
        html: `<div style="
          display:flex;flex-direction:column;align-items:center;
          transform:translate(-50%,-50%);
          pointer-events:none;text-align:center;
        ">
          <span style="font-size:11px;font-weight:700;color:#fff;line-height:1.1;">${loc.count}</span>
          <span style="font-size:9px;color:#e0e7ff;line-height:1;max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${loc.name}</span>
        </div>`,
        iconSize: [0, 0],
      });

      L.marker([loc.lat, loc.lng], { icon: label, interactive: false }).addTo(map);

      marker.on("click", () => onSelectLocation(loc.slug));
      marker.bindTooltip(
        `<b>${loc.name}</b><br>${loc.count} listing${loc.count !== 1 ? "s" : ""}`,
        { direction: "top", offset: [0, -6] },
      );

      markersRef.current.push(marker);
    });

    // If a location is selected, fly to it
    if (selectedSlug) {
      const target = locations.find((l) => l.slug === selectedSlug);
      if (target) {
        map.flyTo([target.lat, target.lng], 10, { duration: 0.8 });
      }
    }
  }, [locations, selectedSlug, onSelectLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-gray-200"
      style={{ height: 420 }}
    />
  );
}
