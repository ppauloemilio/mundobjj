"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { formatDistance } from "@/lib/labels";
import type { AcademyResult, StoreResult } from "@/lib/search";

const ResultMap = dynamic(() => import("@/components/result-map"), {
  ssr: false,
});

type Country = { id: string; name: string; iso2: string };
type StateRow = { id: string; name: string; code: string };
type City = { id: string; name: string };
type Category = { id: string; name: string; slug: string };
type Layer = "academies" | "stores";
type Mode = "nearby" | "place";

const radii = [5, 10, 25];

export function SearchPanel() {
  const [layer, setLayer] = useState<Layer>("academies");
  const [mode, setMode] = useState<Mode>("nearby");
  const [radius, setRadius] = useState(10);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [country, setCountry] = useState("");
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [category, setCategory] = useState("");
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "Escolha perto de mim ou uma cidade para ver academias.",
  );
  const [academies, setAcademies] = useState<AcademyResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [allAcademyPins, setAllAcademyPins] = useState<
    { id: string; name: string; slug: string; lat: number; lng: number; detail: string }[]
  >([]);
  const [searchPinsActive, setSearchPinsActive] = useState(false);

  useEffect(() => {
    void fetch("/api/locations")
      .then((response) => response.json())
      .then((data: { configured: boolean; countries: Country[]; error?: string }) => {
        setConfigured(data.configured);
        setCountries(data.countries);
        if (data.error === "schema") {
          setMessage(
            "O Neon está ligado, mas as tabelas ainda não existem. O próximo passo é rodar npm run db:setup.",
          );
        } else if (!data.configured) {
          setMessage(
            "O Neon ainda não está ligado neste ambiente. A busca abre assim que a DATABASE_URL existir e o seed rodar.",
          );
        }
      });
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

  async function search(next?: { lat?: number; lng?: number; cityId?: string }) {
    const params = new URLSearchParams({ layer, radius: String(radius) });
    const selectedCity = next?.cityId ?? cityId;

    if (mode === "place") {
      if (!selectedCity) {
        setMessage("Escolha país, estado e cidade.");
        return;
      }
      params.set("cityId", selectedCity);
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
          setMessage("Não foi possível ler a localização deste aparelho.");
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
      setMessage(
        data.error === "schema"
          ? "O Neon está ligado, mas as tabelas ainda não existem. O próximo passo é rodar npm run db:setup."
          : "O Neon ainda não está ligado neste ambiente. A busca abre assim que a DATABASE_URL existir e o seed rodar.",
      );
      return;
    }

    setSearchPinsActive(true);

    if (data.layer === "stores") {
      const results = data.results as StoreResult[];
      setStores(results);
      setAcademies([]);
      setMessage(
        results.length
          ? `${results.length} loja${results.length > 1 ? "s" : ""} encontrada${results.length > 1 ? "s" : ""}.`
          : "Nenhuma loja nesta região ainda.",
      );
      return;
    }

    const results = data.results as AcademyResult[];
    setAcademies(results);
    setStores([]);
    setMessage(
      results.length
        ? `${results.length} academia${results.length > 1 ? "s" : ""} encontrada${results.length > 1 ? "s" : ""}.`
        : "Nenhuma academia nesta região ainda. O admin pode cadastrá-la em /admin/academias.",
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
          ? `Patrocinado · ${item.category}`
          : item.professorName || item.city || "Academia",
    }));

  const pins =
    layer === "academies" && !searchPinsActive
      ? allAcademyPins
      : searchPins;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-2">
          <FilterButton
            active={layer === "academies"}
            onClick={() => {
              setLayer("academies");
              setSearchPinsActive(false);
            }}
          >
            Academias
          </FilterButton>
          <FilterButton
            active={layer === "stores"}
            onClick={() => {
              setLayer("stores");
              setSearchPinsActive(true);
            }}
          >
            Lojas
          </FilterButton>
        </div>

        {layer === "stores" ? (
          <div className="flex flex-wrap gap-2">
            <Chip active={category === ""} onClick={() => setCategory("")}>
              Todas
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

        <div className="grid grid-cols-2 gap-2">
          <FilterButton active={mode === "nearby"} onClick={() => setMode("nearby")}>
            Perto de mim
          </FilterButton>
          <FilterButton active={mode === "place"} onClick={() => setMode("place")}>
            Por lugar
          </FilterButton>
        </div>

        {mode === "place" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              label="País"
              value={country}
              onChange={(value) => {
                setCountry(value);
                setStateId("");
                setCityId("");
                setStates([]);
                setCities([]);
              }}
              options={countries.map((item) => ({ value: item.iso2, label: item.name }))}
            />
            <Select
              label="Estado"
              value={stateId}
              disabled={!country}
              onChange={(value) => {
                setStateId(value);
                setCityId("");
                setCities([]);
              }}
              options={states.map((item) => ({ value: item.id, label: item.name }))}
            />
            <Select
              label="Cidade"
              value={cityId}
              disabled={!stateId}
              onChange={setCityId}
              options={cities.map((item) => ({ value: item.id, label: item.name }))}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
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
          className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-base font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      <p className="text-sm text-[var(--muted)]">{message}</p>

      {layer === "academies" &&
      !searchPinsActive &&
      allAcademyPins.length > 0 ? (
        <p className="text-xs text-[var(--muted)]">
          Bolinhas no mapa: todas as academias com endereço salvo (
          {allAcademyPins.length}). Use Buscar para filtrar por região.
        </p>
      ) : null}

      <ResultMap pins={pins} />

      <div className="grid gap-3">
        {layer === "academies"
          ? academies.map((academy) => (
              <article
                key={academy.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{academy.name}</h2>
                  <span className="text-sm text-[var(--muted)]">
                    {formatDistance(academy.distanceKm)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[academy.professorName, academy.neighborhood, academy.city, academy.state]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {academy.nextClass ? (
                  <p className="mt-2 text-sm">{academy.nextClass}</p>
                ) : null}
                {academy.acceptsVisitor ? (
                  <p className="mt-2 text-sm">
                    Aceita visitante
                    {academy.dropInPrice ? ` · R$ ${academy.dropInPrice}` : ""}
                  </p>
                ) : null}
              </article>
            ))
          : stores.map((store) => (
              <article
                key={store.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{store.name}</h2>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                    Patrocinado
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
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
      className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--line)] bg-white"
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
      className={`min-h-11 rounded-full px-4 text-sm ${
        active ? "bg-[var(--ink)] text-white" : "bg-white border border-[var(--line)]"
      }`}
    >
      {children}
    </button>
  );
}

function Select({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 disabled:opacity-50"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
