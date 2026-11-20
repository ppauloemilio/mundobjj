"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

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
  const { locale, t } = useLocale();
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
    if (initialCountryIso2) setCountry(initialCountryIso2);
  }, [initialCountryIso2]);

  useEffect(() => {
    if (initialStateCode) setStateCode(initialStateCode);
  }, [initialStateCode]);

  useEffect(() => {
    if (initialCityName) setCityName(initialCityName);
  }, [initialCityName]);

  useEffect(() => {
    if (hideCountry) return;
    void fetch(`/api/geo?locale=${locale}`)
      .then((response) => response.json())
      .then((data: { countries: Country[] }) => setCountries(data.countries ?? []));
  }, [hideCountry, locale]);

  useEffect(() => {
    if (!country || country === OTHER) {
      setStates([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/geo?country=${country}&locale=${locale}`)
      .then((response) => response.json())
      .then((data: { states: StateRow[] }) => {
        if (!ignore) setStates(data.states ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [country, locale]);

  useEffect(() => {
    if (!country || !stateCode || stateCode === OTHER || country === OTHER) {
      setCities([]);
      return;
    }
    let ignore = false;
    void fetch(`/api/geo?country=${country}&state=${stateCode}&locale=${locale}`)
      .then((response) => response.json())
      .then((data: { cities: City[] }) => {
        if (!ignore) setCities(data.cities ?? []);
      });
    return () => {
      ignore = true;
    };
  }, [country, stateCode, locale]);

  return (
    <div
      className={`grid gap-2.5 ${hideCountry ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}
    >
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
        <label className="flex flex-col gap-1 text-[13px]">
          {t("country")}
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
            className="ui-input"
          >
            <option value="">{t("searchSelect")}</option>
            {countries.map((item) => (
              <option key={item.iso2} value={item.iso2}>
                {item.name}
              </option>
            ))}
            <option value={OTHER}>{t("other")}</option>
          </select>
          {countryOther ? (
            <input
              name="customCountry"
              value={customCountry}
              onChange={(event) => setCustomCountry(event.target.value)}
              required={required}
              placeholder={t("customCountry")}
              className="ui-input mt-1.5"
            />
          ) : null}
        </label>
      )}

      <label className="flex flex-col gap-1 text-[13px]">
        {t("state")}
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
          className="ui-input"
        >
          <option value="">{t("searchSelect")}</option>
          {!countryOther
            ? states.map((item) => (
                <option key={item.isoCode} value={item.isoCode}>
                  {item.name}
                </option>
              ))
            : null}
          <option value={OTHER}>{t("other")}</option>
        </select>
        {stateOther ? (
          <input
            name="customState"
            value={customState}
            onChange={(event) => setCustomState(event.target.value)}
            required={required}
            placeholder={t("customState")}
            className="ui-input mt-1.5"
          />
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-[13px]">
        {t("city")}
        <select
          value={cityName}
          required={required && Boolean(stateCode)}
          disabled={!stateCode}
          onChange={(event) => setCityName(event.target.value)}
          className="ui-input"
        >
          <option value="">{t("searchSelect")}</option>
          {!stateOther
            ? cities.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))
            : null}
          <option value={OTHER}>{t("other")}</option>
        </select>
        {cityOther ? (
          <input
            name="customCity"
            value={customCity}
            onChange={(event) => setCustomCity(event.target.value)}
            required={required}
            placeholder={t("customCity")}
            className="ui-input mt-1.5"
          />
        ) : null}
      </label>
    </div>
  );
}
