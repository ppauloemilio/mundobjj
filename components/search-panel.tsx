"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import { formatDistance } from "@/lib/labels";
import type { AcademyResult, StoreResult } from "@/lib/search";

const ResultMap = dynamic(() => import("@/components/result-map"), {
  ssr: false,
});

type Country = { iso2: string; name: string };
type StateRow = { isoCode: string; name: string };
type City = { name: string };
type Category = { id: string; name: string; slug: string };
type Layer = "academies" | "stores";
type Mode = "nearby" | "place";

const radii = [5, 10, 25];

export function SearchPanel() {
  const { locale, t } = useLocale();
  const [layer, setLayer] = useState<Layer>("academies");
  const [mode, setMode] = useState<Mode>("nearby");
  const [radius, setRadius] = useState(10);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [country, setCountry] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [cityName, setCityName] = useState("");
  const [category, setCategory] = useState("");
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [academies, setAcademies] = useState<AcademyResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [allAcademyPins, setAllAcademyPins] = useState<
    { id: string; name: string; slug: string; lat: number; lng: number; detail: string }[]
  >([]);
  const [searchPinsActive, setSearchPinsActive] = useState(false);

  useEffect(() => {
    setMessage(t("searchHint"));
  }, [t, locale]);

  useEffect(() => {
    void fetch(`/api/geo?locale=${locale}`)
      .then((response) => response.json())
      .then((data: { countries: Country[] }) => {
        setCountries(data.countries ?? []);
        setConfigured(true);
      })
      .catch(() => setConfigured(false));
    void fetch("/api/categories")
      .then((response) => response.json())
      .then((data: { categories: Category[] }) => setCategories(data.categories));
    void fetch("/api/academies/map")
      .then((response) => response.json())
      .then(
        (data: {
          pins: {
            id: string;
            name: string;
            slug: string;
            lat: number;
            lng: number;
            detail: string;
          }[];
        }) => {
          if (data.pins?.length) setAllAcademyPins(data.pins);
        },
      );
  }, [locale]);

  useEffect(() => {
    if (!country) return;
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
    if (!country || !stateCode) return;
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

  async function search(next?: { lat?: number; lng?: number; cityId?: string }) {
    const params = new URLSearchParams({ layer, radius: String(radius) });

    if (mode === "place") {
      if (!country || !stateCode || !cityName) {
        setMessage(t("searchNeedPlace"));
        return;
      }
      setLoading(true);
      const resolved = await fetch("/api/geo/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryIso2: country,
          stateCode,
          cityName,
        }),
      }).then(
        (response) =>
          response.json() as Promise<{ cityId: string | null; configured: boolean }>,
      );
      if (!resolved.configured || !resolved.cityId) {
        setLoading(false);
        setMessage(
          resolved.configured ? t("searchCityFail") : t("searchDbOff"),
        );
        return;
      }
      params.set("cityId", next?.cityId ?? resolved.cityId);
    } else if (next?.lat != null && next.lng != null) {
      params.set("lat", String(next.lat));
      params.set("lng", String(next.lng));
    } else {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void search({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setLoading(false);
          setMessage(t("searchGeoDenied"));
        },
      );
      return;
    }

    if (layer === "stores" && category) params.set("category", category);

    setLoading(true);
    const response = await fetch(`/api/search?${params.toString()}`);
    const data = (await response.json()) as {
      configured: boolean;
      layer: Layer;
      results: AcademyResult[] | StoreResult[];
      error?: string;
    };
    setConfigured(data.configured);
    setLoading(false);

    if (!data.configured || data.error === "schema") {
      setAcademies([]);
      setStores([]);
      setMessage(t("searchDbOff"));
      return;
    }

    setSearchPinsActive(true);

    if (data.layer === "stores") {
      const results = data.results as StoreResult[];
      setStores(results);
      setAcademies([]);
      setMessage(
        results.length
          ? t(
              results.length > 1
                ? "searchStoresFoundPlural"
                : "searchStoresFound",
              { n: results.length },
            )
          : t("searchNoStores"),
      );
      return;
    }

    const results = data.results as AcademyResult[];
    setAcademies(results);
    setStores([]);
    setMessage(
      results.length
        ? t(
            results.length > 1
              ? "searchAcademiesFoundPlural"
              : "searchAcademiesFound",
            { n: results.length },
          )
        : t("searchNoAcademies"),
    );
  }

  const searchPins = (layer === "stores" ? stores : academies)
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.lat as number,
      lng: item.lng as number,
      slug: "slug" in item ? item.slug : undefined,
      detail:
        "category" in item
          ? `${t("sponsored")} · ${item.category}`
          : item.professorName || item.city || t("searchAcademies"),
    }));

  const pins =
    layer === "academies" && !searchPinsActive
      ? allAcademyPins
      : searchPins;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="ui-card flex flex-col gap-3.5 p-3.5 sm:p-4">
        <div className="grid grid-cols-2 gap-1.5">
          <FilterButton
            active={layer === "academies"}
            onClick={() => {
              setLayer("academies");
              setSearchPinsActive(false);
            }}
          >
            {t("searchAcademies")}
          </FilterButton>
          <FilterButton
            active={layer === "stores"}
            onClick={() => {
              setLayer("stores");
              setSearchPinsActive(true);
            }}
          >
            {t("searchStores")}
          </FilterButton>
        </div>

        {layer === "stores" ? (
          <div className="flex flex-wrap gap-1.5">
            <Chip active={category === ""} onClick={() => setCategory("")}>
              {t("searchAll")}
            </Chip>
            {categories.map((item) => (
              <Chip
                key={item.id}
                active={category === item.slug}
                onClick={() => setCategory(item.slug)}
              >
                {item.name}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-1.5">
          <FilterButton active={mode === "nearby"} onClick={() => setMode("nearby")}>
            {t("searchNearby")}
          </FilterButton>
          <FilterButton active={mode === "place"} onClick={() => setMode("place")}>
            {t("searchByPlace")}
          </FilterButton>
        </div>

        {mode === "place" ? (
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Select
              label={t("country")}
              selectLabel={t("searchSelect")}
              value={country}
              onChange={(value) => {
                setCountry(value);
                setStateCode("");
                setCityName("");
                setStates([]);
                setCities([]);
              }}
              options={countries.map((item) => ({
                value: item.iso2,
                label: item.name,
              }))}
            />
            <Select
              label={t("state")}
              selectLabel={t("searchSelect")}
              value={stateCode}
              disabled={!country}
              onChange={(value) => {
                setStateCode(value);
                setCityName("");
                setCities([]);
              }}
              options={states.map((item) => ({
                value: item.isoCode,
                label: item.name,
              }))}
            />
            <Select
              label={t("city")}
              selectLabel={t("searchSelect")}
              value={cityName}
              disabled={!stateCode}
              onChange={setCityName}
              options={cities.map((item) => ({
                value: item.name,
                label: item.name,
              }))}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {radii.map((value) => (
              <Chip key={value} active={radius === value} onClick={() => setRadius(value)}>
                {value} km
              </Chip>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => void search()}
          disabled={loading || !configured}
          className="ui-btn ui-btn-primary w-fit"
        >
          {loading ? t("searchLoading") : t("searchButton")}
        </button>
      </div>

      <p className="text-[13px] text-[var(--muted)]">{message}</p>

      {layer === "academies" &&
      !searchPinsActive &&
      allAcademyPins.length > 0 ? (
        <p className="text-[12px] text-[var(--muted)]">
          {t("searchMapHint", { n: allAcademyPins.length })}
        </p>
      ) : null}

      <ResultMap pins={pins} />

      <div className="grid gap-2.5">
        {layer === "academies"
          ? academies.map((academy) => (
              <article key={academy.id} className="ui-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-semibold tracking-tight">
                    {academy.name}
                  </h2>
                  <span className="text-[12px] text-[var(--muted)]">
                    {formatDistance(academy.distanceKm)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {[academy.professorName, academy.neighborhood, academy.city, academy.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {academy.nextClass ? (
                  <p className="mt-1.5 text-[13px]">{academy.nextClass}</p>
                ) : null}
                {academy.acceptsVisitor ? (
                  <p className="mt-1.5 text-[13px]">
                    {t("acceptsVisitor")}
                    {academy.dropInPrice ? ` · R$ ${academy.dropInPrice}` : ""}
                  </p>
                ) : null}
              </article>
            ))
          : stores.map((store) => (
              <article key={store.id} className="ui-card p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-semibold tracking-tight">
                    {store.name}
                  </h2>
                  <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
                    {t("sponsored")}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--muted)]">
                  {[store.category, store.city, formatDistance(store.distanceKm)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </article>
            ))}
      </div>
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-lg border px-3 text-[13px] font-semibold transition ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]/20"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-8 rounded-md px-3 text-[12px] font-medium transition ${
        active
          ? "bg-[var(--ink)] text-white"
          : "border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  selectLabel,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  selectLabel: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="ui-input"
      >
        <option value="">{selectLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
