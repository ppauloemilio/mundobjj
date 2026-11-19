type NominatimResult = {
  lat: string;
  lon: string;
};

export async function geocodeAddress(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "MundoBJJ/0.1 (https://mundobjj.vercel.app)",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (!first) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}
