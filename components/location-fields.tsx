"use client";

import { useEffect, useState } from "react";

type Country = { id: string; name: string; iso2: string };
type StateRow = { id: string; name: string; code: string };
type City = { id: string; name: string };

const OTHER = "__other__";

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
  const [customCountry, setCustomCountry] = useState("");
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");

  const countryOther = country === OTHER;
  const stateOther = stateId === OTHER;
  const cityOther = cityId === OTHER;

  useEffect(() => {
    void fetch("/api/locations")
      .then((response) => response.json())
      .then((data: { countries: Country[] }) => setCountries(data.countries ?? []));
  }, []);

  useEffect(() => {
    if (!country || country === OTHER) {
      setStates([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/locations?country=${country}`)
      .then((response) => response.json())
      .then((data: { states: StateRow[] }) => {
        if (!ignore) setStates(data.states ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [country]);

  useEffect(() => {
    if (!stateId || stateId === OTHER) {
      setCities([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/locations?state=${stateId}`)
      .then((response) => response.json())
      .then((data: { cities: City[] }) => {
        if (!ignore) setCities(data.cities ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [stateId]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <input
        type="hidden"
        name="countryMode"
        value={countryOther ? "other" : "list"}
      />
      <input type="hidden" name="stateMode" value={stateOther ? "other" : "list"} />
      <input type="hidden" name="cityMode" value={cityOther ? "other" : "list"} />
      {!country && initialCityId ? (
        <input type="hidden" name="cityId" value={initialCityId} />
      ) : null}
      {!countryOther && country ? (
        <input type="hidden" name="countryIso2" value={country} />
      ) : null}
      {!stateOther && stateId ? (
        <input type="hidden" name="stateId" value={stateId} />
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        País
        <select
          value={country}
          required={required}
          onChange={(event) => {
            setCountry(event.target.value);
            setStateId("");
            setCityId("");
            setStates([]);
            setCities([]);
            setCustomState("");
            setCustomCity("");
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
          <option value={OTHER}>Outro</option>
        </select>
        {countryOther ? (
          <input
            name="customCountry"
            value={customCountry}
            onChange={(event) => setCustomCountry(event.target.value)}
            required={required}
            placeholder="Digite o país"
            className="mt-2 min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Estado
        <select
          value={stateId}
          required={required && Boolean(country)}
          disabled={!country}
          onChange={(event) => {
            setStateId(event.target.value);
            setCityId("");
            setCities([]);
            setCustomCity("");
          }}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {!countryOther
            ? states.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            : null}
          <option value={OTHER}>Outro</option>
        </select>
        {stateOther ? (
          <input
            name="customState"
            value={customState}
            onChange={(event) => setCustomState(event.target.value)}
            required={required}
            placeholder="Digite o estado"
            className="mt-2 min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <select
          name={!cityOther && country ? "cityId" : undefined}
          value={cityId}
          required={required && Boolean(stateId)}
          disabled={!stateId}
          onChange={(event) => setCityId(event.target.value)}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {!stateOther
            ? cities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            : null}
          <option value={OTHER}>Outro</option>
        </select>
        {cityOther ? (
          <input
            name="customCity"
            value={customCity}
            onChange={(event) => setCustomCity(event.target.value)}
            required={required}
            placeholder="Digite a cidade"
            className="mt-2 min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        ) : null}
      </label>
    </div>
  );
}
