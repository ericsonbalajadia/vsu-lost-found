// src/components/LocationPicker.tsx
// VSU Campus Location Picker — React + Leaflet + Nominatim
// TypeScript, draggable marker, reverse geocoding, Supabase-ready output

import { useEffect, useRef, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon paths broken by Vite bundling
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocationData {
  lat: number;
  lng: number;
  displayName: string;   // Human-readable address from Nominatim
  building: string;      // Extracted building/amenity name
}

interface LocationPickerProps {
  /** Called whenever the marker is moved or clicked */
  onChange: (location: LocationData) => void;
  /** Initial coordinates (defaults to VSU center) */
  initialLat?: number;
  initialLng?: number;
  /** Height of the map container */
  height?: string;
  /** Show a loading indicator while geocoding */
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VSU_CENTER: [number, number] = [10.6765, 124.7923];
const DEFAULT_ZOOM = 17;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

// VSU building list for display (matched against Nominatim results)
const VSU_BUILDINGS = [
  "Main Library",
  "Science Building",
  "Engineering Building",
  "Student Union",
  "Cafeteria",
  "Gymnasium",
  "Administration Building",
  "College of Agriculture",
  "Research Center",
  "Dormitory",
];

// ─── Nominatim Reverse Geocoder ───────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<{ displayName: string; building: string }> {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      {
        headers: {
          // Nominatim requires a User-Agent identifying your app
          "User-Agent": "VSU-LostFound/1.0 (vsu.edu.ph)",
        },
      }
    );

    if (!res.ok) throw new Error("Nominatim request failed");

    const data = await res.json();
    const addr = data.address || {};

    // Extract the most specific place name available
    const building =
      addr.building ||
      addr.amenity ||
      addr.leisure ||
      addr.tourism ||
      addr.office ||
      addr.university ||
      "VSU Campus";

    // Match against known VSU buildings
    const matchedBuilding =
      VSU_BUILDINGS.find((b) =>
        data.display_name?.toLowerCase().includes(b.toLowerCase())
      ) || building;

    return {
      displayName: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      building: matchedBuilding,
    };
  } catch {
    return {
      displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      building: "VSU Campus",
    };
  }
}

// ─── Custom VSU Marker Icon ───────────────────────────────────────────────────

function createVSUMarker(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 36px; height: 36px;
        background: linear-gradient(135deg, #2c5bb6, #1b4fa9);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(44,91,182,0.4);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          margin-bottom: 2px;
        ">📍</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LocationPicker({
  onChange,
  initialLat = VSU_CENTER[0],
  initialLng = VSU_CENTER[1],
  height = "400px",
  className = "",
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>("Drag the pin or click to set location");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  // Geocode + emit to parent
  const updateLocation = useCallback(
    async (lat: number, lng: number) => {
      setCoords({ lat, lng });
      setIsGeocoding(true);

      const { displayName, building } = await reverseGeocode(lat, lng);

      setLocationLabel(building !== "VSU Campus" ? building : displayName);
      setIsGeocoding(false);

      onChange({ lat, lng, displayName, building });
    },
    [onChange]
  );

  // Initialize Leaflet map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    // OpenStreetMap tile layer (free, no API key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Create draggable marker at initial position
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: createVSUMarker(),
    }).addTo(map);

    // Update on drag end
    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      updateLocation(lat, lng);
    });

    // Update on map click
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      updateLocation(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Initial geocode
    updateLocation(initialLat, initialLng);

    // Cleanup
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#acb3b6]/30 ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
      />

      {/* Location label overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          zIndex: 1000,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderRadius: "0.75rem",
          padding: "8px 12px",
          boxShadow: "0 4px 12px rgba(44,52,54,0.12)",
          maxWidth: "260px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          color: "#2c3436",
        }}
      >
        {isGeocoding ? (
          <>
            <span style={{ color: "#2c5bb6" }}>⟳</span>
            <span style={{ color: "#596063" }}>Locating…</span>
          </>
        ) : (
          <>
            <span style={{ color: "#2c5bb6" }}>📍</span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {locationLabel}
            </span>
          </>
        )}
      </div>

      {/* Coordinates readout (dev/admin use) */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1000,
          background: "rgba(44,91,182,0.85)",
          borderRadius: "0.5rem",
          padding: "4px 10px",
          fontSize: "10px",
          fontFamily: "monospace",
          color: "white",
          letterSpacing: "0.05em",
        }}
      >
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </div>

      {/* Drag hint */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex: 999,
          opacity: 0,
          animation: "none",
        }}
      />
    </div>
  );
}

// ─── Usage Example ────────────────────────────────────────────────────────────
/*
import LocationPicker, { LocationData } from '@/components/LocationPicker'

function ReportForm() {
  const [location, setLocation] = useState<LocationData | null>(null)

  const handleLocationChange = (loc: LocationData) => {
    setLocation(loc)
    // Store in Supabase item record:
    // { location_lat: loc.lat, location_lng: loc.lng,
    //   location_name: loc.displayName, location_building: loc.building }
  }

  return (
    <div>
      <LocationPicker
        onChange={handleLocationChange}
        height="350px"
        className="shadow-lg"
      />
      {location && (
        <p className="text-sm text-on-surface-variant mt-2">
          📍 {location.building}
        </p>
      )}
    </div>
  )
}
*/
