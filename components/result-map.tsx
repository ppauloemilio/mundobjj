"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  detail: string;
  slug?: string;
};

type Props = {
  pins: MapPin[];
  center?: [number, number] | null;
  zoom?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

const brand = "var(--brand, #b4232e)";

function MapController({
  pins,
  center,
  zoom,
}: {
  pins: MapPin[];
  center?: [number, number] | null;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom ?? (pins.length ? 12 : 3));
      return;
    }
    if (pins.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    map.fitBounds(
      pins.map((pin) => [pin.lat, pin.lng] as [number, number]),
      { padding: [36, 36], maxZoom: 14 },
    );
  }, [map, pins, center, zoom]);

  return null;
}

function ClusterLayer({
  pins,
  selectedId,
  onSelect,
}: {
  pins: MapPin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const cluster = (L as typeof L & {
      markerClusterGroup: (options?: object) => L.MarkerClusterGroup;
    }).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
    });

    for (const pin of pins) {
      const marker = L.circleMarker([pin.lat, pin.lng], {
        radius: pin.id === selectedId ? 11 : 8,
        color: pin.id === selectedId ? "#17161b" : "#b4232e",
        fillColor: pin.id === selectedId ? "#b4232e" : "#b4232e",
        fillOpacity: 0.92,
        weight: pin.id === selectedId ? 3 : 2,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(pin.name)}</strong><br/>${escapeHtml(pin.detail)}`,
      );
      marker.on("click", () => onSelect?.(pin.id));
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, pins, selectedId, onSelect]);

  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export default function ResultMap({
  pins,
  center,
  zoom,
  selectedId,
  onSelect,
  className,
}: Props) {
  const initialCenter = useMemo<[number, number]>(
    () => center ?? (pins[0] ? [pins[0].lat, pins[0].lng] : [20, 0]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for first paint
    [],
  );

  const useCluster = pins.length > 12;

  return (
    <MapContainer
      center={initialCenter}
      zoom={zoom ?? (pins.length ? 12 : 2)}
      scrollWheelZoom
      className={className ?? "h-full min-h-[45vh] w-full rounded-2xl"}
      style={{ background: "var(--bg)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController pins={pins} center={center} zoom={zoom} />
      {useCluster ? (
        <ClusterLayer pins={pins} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        pins.map((pin) => (
          <CircleMarker
            key={pin.id}
            center={[pin.lat, pin.lng]}
            radius={pin.id === selectedId ? 11 : 8}
            pathOptions={{
              color: pin.id === selectedId ? "#17161b" : "#b4232e",
              fillColor: "#b4232e",
              fillOpacity: 0.92,
              weight: pin.id === selectedId ? 3 : 2,
            }}
            eventHandlers={{
              click: () => onSelect?.(pin.id),
            }}
          />
        ))
      )}
      <span className="sr-only" style={{ color: brand }}>
        map
      </span>
    </MapContainer>
  );
}
