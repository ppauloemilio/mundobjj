"use client";

import { useEffect, useState } from "react";

type Country = { id: string; name: string; iso2: string };
type StateRow = { id: string; name: string; code: string };
type City = { id: string; name: string };

export function LocationFields({
  initialCityId = "",
  required = false,
}: {
  initialCityId?: string;
  required?: boolean;
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [country, setCountry] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState(initialCityId);

  useEffect(() => {
    void fetch("/api/locations")
      .then((response) => response.json())
      .then((data: { countries: Country[] }) => setCountries(data.countries));
  }, []);

  useEffect(() => {
    if (!country) return;
    let ignore = false;
    void fetch(`/api/locations?country=${country}`)
      .then((response) => response.json())
      .then((data: { states: StateRow[] }) => {
        if (!ignore) setStates(data.states);
      });
    return () => {
      ignore = true;
    };
  }, [country]);

  useEffect(() => {
    if (!stateId) return;
    let ignore = false;
    void fetch(`/api/locations?state=${stateId}`)
      .then((response) => response.json())
      .then((data: { cities: City[] }) => {
        if (!ignore) setCities(data.cities);
      });
    return () => {
      ignore = true;
    };
  }, [stateId]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {!country && initialCityId ? (
        <input type="hidden" name="cityId" value={initialCityId} />
      ) : null}
      <label className="flex flex-col gap-1 text-sm">
        País
        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setStateId("");
            setCityId("");
            setStates([]);
            setCities([]);
          }}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        >
          <option value="">
            {initialCityId && !country ? "Manter cidade atual" : "Selecione"}
          </option>
          {countries.map((item) => (
            <option key={item.id} value={item.iso2}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Estado
        <select
          value={stateId}
          disabled={!country}
          onChange={(event) => {
            setStateId(event.target.value);
            setCityId("");
            setCities([]);
          }}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {states.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <select
          name={country ? "cityId" : undefined}
          value={cityId}
          required={required && Boolean(country)}
          disabled={!stateId}
          onChange={(event) => setCityId(event.target.value)}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {cities.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
