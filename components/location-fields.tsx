"use client";

import { useEffect, useState } from "react";

type Country = { iso2: string; name: string };
type StateRow = { isoCode: string; name: string };
type City = { name: string };

const OTHER = "__other__";

export function LocationFields({
  initialCountryIso2 = "",
  initialStateCode = "",
  initialCityName = "",
  required = false,
  hideCountry = false,
}: {
  initialCountryIso2?: string;
  initialStateCode?: string;
  initialCityName?: string;
  required?: boolean;
  /** Quando true, país vem de fora (ex.: AddressFields) */
  hideCountry?: boolean;
}) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [country, setCountry] = useState(initialCountryIso2 || "");
  const [stateCode, setStateCode] = useState(initialStateCode || "");
  const [cityName, setCityName] = useState(initialCityName || "");
  const [customCountry, setCustomCountry] = useState("");
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");

  const countryOther = country === OTHER;
  const stateOther = stateCode === OTHER;
  const cityOther = cityName === OTHER;

  useEffect(() => {
    if (hideCountry && initialCountryIso2) {
      setCountry(initialCountryIso2);
    }
  }, [hideCountry, initialCountryIso2]);

  useEffect(() => {
    if (hideCountry) return;
    void fetch("/api/geo")
      .then((response) => response.json())
      .then((data: { countries: Country[] }) => setCountries(data.countries ?? []));
  }, [hideCountry]);

  useEffect(() => {
    if (!country || country === OTHER) {
      setStates([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/geo?country=${country}`)
      .then((response) => response.json())
      .then((data: { states: StateRow[] }) => {
        if (!ignore) setStates(data.states ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [country]);

  useEffect(() => {
    if (!country || !stateCode || stateCode === OTHER || country === OTHER) {
      setCities([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/geo?country=${country}&state=${stateCode}`)
      .then((response) => response.json())
      .then((data: { cities: City[] }) => {
        if (!ignore) setCities(data.cities ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [country, stateCode]);

  return (
    <div className={`grid gap-3 ${hideCountry ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
      <input type="hidden" name="countryMode" value={countryOther ? "other" : "list"} />
      <input type="hidden" name="stateMode" value={stateOther ? "other" : "list"} />
      <input type="hidden" name="cityMode" value={cityOther ? "other" : "list"} />
      {!countryOther && country ? (
        <input type="hidden" name="countryIso2" value={country} />
      ) : null}
      {!stateOther && stateCode ? (
        <input type="hidden" name="stateCode" value={stateCode} />
      ) : null}
      {!cityOther && cityName ? (
        <input type="hidden" name="cityName" value={cityName} />
      ) : null}

      {hideCountry ? null : (
        <label className="flex flex-col gap-1 text-sm">
          País
          <select
            value={country}
            required={required}
            onChange={(event) => {
              setCountry(event.target.value);
              setStateCode("");
              setCityName("");
              setStates([]);
              setCities([]);
              setCustomState("");
              setCustomCity("");
            }}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          >
            <option value="">Selecione</option>
            {countries.map((item) => (
              <option key={item.iso2} value={item.iso2}>
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
      )}

      <label className="flex flex-col gap-1 text-sm">
        Estado
        <select
          value={stateCode}
          required={required && Boolean(country)}
          disabled={!country}
          onChange={(event) => {
            setStateCode(event.target.value);
            setCityName("");
            setCities([]);
            setCustomCity("");
          }}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {!countryOther
            ? states.map((item) => (
                <option key={item.isoCode} value={item.isoCode}>
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
          value={cityName}
          required={required && Boolean(stateCode)}
          disabled={!stateCode}
          onChange={(event) => setCityName(event.target.value)}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
        >
          <option value="">Selecione</option>
          {!stateOther
            ? cities.map((item) => (
                <option key={item.name} value={item.name}>
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