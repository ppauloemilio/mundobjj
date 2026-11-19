"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  detail: string;
  slug?: string;
};

const dotStyle = {
  color: "#9f2d2d",
  fillColor: "#9f2d2d",
  fillOpacity: 0.9,
  weight: 2,
};

function FitPins({ pins }: { pins: MapPin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    map.fitBounds(
      pins.map((pin) => [pin.lat, pin.lng]),
      { padding: [32, 32], maxZoom: 14 },
    );
  }, [map, pins]);

  return null;
}

export default function ResultMap({ pins }: { pins: MapPin[] }) {
  const center: [number, number] =
    pins.length > 0 ? [pins[0].lat, pins[0].lng] : [-14.235, -51.9253];

  return (
    <MapContainer
      center={center}
      zoom={pins.length ? 12 : 4}
      scrollWheelZoom={false}
      className="h-80 w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitPins pins={pins} />
      {pins.map((pin) => (
        <CircleMarker
          key={pin.id}
          center={[pin.lat, pin.lng]}
          radius={9}
          pathOptions={dotStyle}
        >
          <Popup>
            <strong>{pin.name}</strong>
            <br />
            {pin.detail}
            {pin.slug ? (
              <>
                <br />
                <Link href={`/academia/${pin.slug}`} className="underline">
                  Ver academia
                </Link>
              </>
            ) : null}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}