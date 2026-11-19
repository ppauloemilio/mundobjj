"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Pin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  detail: string;
};

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitPins({ pins }: { pins: Pin[] }) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    map.fitBounds(
      pins.map((pin) => [pin.lat, pin.lng]),
      { padding: [32, 32] },
    );
  }, [map, pins]);

  return null;
}

export default function ResultMap({ pins }: { pins: Pin[] }) {
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
        <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={icon}>
          <Popup>
            <strong>{pin.name}</strong>
            <br />
            {pin.detail}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
