"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AcademyCardSkeleton,
  AcademyResultCard,
} from "@/components/academy-result-card";
import { useLocale } from "@/components/locale-provider";
import { Chip } from "@/components/ui/chip";
import { MapSnapSheet, type SnapState } from "@/components/ui/map-snap-sheet";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { formatDistance } from "@/lib/labels";
import type { AcademyResult, StoreResult } from "@/lib/search";

const ResultMap = dynamic(() => import("@/components/result-map"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[45vh] animate-pulse rounded-2xl bg-[var(--line)]" />
  ),
});

type Layer = "academies" | "stores";
type Category = { id: string; name: string; slug: string };

const radii = [5, 10, 25] as const;

export function SearchPanel() {
  const { t } = useLocale();
  const [layer, setLayer] = useState<Layer>("academies");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState<(typeof radii)[number]>(10);
  const [visitorOnly, setVisitorOnly] = useState(false);
  const [gi, setGi] = useState(false);
  const [nogi, setNogi] = useState(false);
  const [todayOnly, setTodayOnly] = useState(false);
  const [kids, setKids] = useState(false);
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(true);
  const [academies, setAcademies] = useState<AcademyResult[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SnapState>("mid");
  const [profile, setProfile] = useState<{
    belt?: string | null;
    cityName?: string | null;
  } | null>(null);
  const bootstrapped = useRef(false);

  const kinds = useMemo(() => {
    const list: string[] = [];
    if (gi) list.push("gi");
    if (nogi) list.push("nogi");
    if (kids) list.push("kids");
    return list;
  }, [gi, nogi, kids]);

  const search = useCallback(
    async (opts?: {
      lat?: number;
      lng?: number;
      cityId?: string | null;
      q?: string;
    }) => {
      const lat = opts?.lat ?? center?.[0];
      const lng = opts?.lng ?? center?.[1];
      const nextCityId = opts?.cityId === undefined ? cityId : opts.cityId;
      const q = opts?.q ?? query;

      const params = new URLSearchParams({
        layer,
        radius: String(radius),
      });
      if (lat != null && lng != null) {
        params.set("lat", String(lat));
        params.set("lng", String(lng));
      }
      if (nextCityId) params.set("cityId", nextCityId);
      if (q.trim()) params.set("q", q.trim());
      if (layer === "academies") {
        if (visitorOnly) params.set("visitor", "1");
        if (todayOnly) params.set("today", "1");
        for (const kind of kinds) params.append("kind", kind);
      }
      if (layer === "stores" && category) params.set("category", category);

      setLoading(true);
      setHasSearched(true);
      try {
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = (await response.json()) as {
          layer: Layer;
          results: AcademyResult[] | StoreResult[];
        };
        if (data.layer === "stores") {
          setStores(data.results as StoreResult[]);
          setAcademies([]);
        } else {
          setAcademies(data.results as AcademyResult[]);
          setStores([]);
        }
        setSheet("mid");
      } finally {
        setLoading(false);
      }
    },
    [
      center,
      cityId,
      query,
      layer,
      radius,
      visitorOnly,
      todayOnly,
      kinds,
      category,
    ],
  );

  useEffect(() => {
    void fetch("/api/categories")
      .then((response) => response.json())
      .then((data: { categories: Category[] }) =>
        setCategories(data.categories ?? []),
      );
  }, []);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    async function bootstrap() {
      setLocating(true);
      let profileData: {
        location?: {
          cityId: string;
          cityName: string;
          lat: number | null;
          lng: number | null;
        } | null;
        belt?: string | null;
        cityName?: string | null;
      } = {};

      try {
        profileData = await fetch("/api/me/location").then((r) => r.json());
        setProfile({
          belt: profileData.belt,
          cityName: profileData.cityName,
        });
      } catch {
        /* guest */
      }

      const applyCoords = async (lat: number, lng: number) => {
        setCenter([lat, lng]);
        setCityId(null);
        await search({ lat, lng, cityId: null, q: "" });
      };

      const geoOk = await new Promise<boolean>((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            void applyCoords(
              position.coords.latitude,
              position.coords.longitude,
            ).finally(() => resolve(true));
          },
          () => resolve(false),
          { enableHighAccuracy: false, timeout: 8000 },
        );
      });

      if (!geoOk) {
        const loc = profileData.location;
        if (loc?.cityId) {
          setCityId(loc.cityId);
          if (loc.lat != null && loc.lng != null) {
            setCenter([loc.lat, loc.lng]);
            await search({
              lat: loc.lat,
              lng: loc.lng,
              cityId: loc.cityId,
              q: "",
            });
          } else {
            await search({ cityId: loc.cityId, q: "" });
          }
        } else {
          setHasSearched(false);
          setLoading(false);
        }
      }
      setLocating(false);
    }

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once
  }, []);

  useEffect(() => {
    if (!bootstrapped.current || locating) return;
    if (!hasSearched && !center && !cityId && !query.trim()) return;
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filter refresh
  }, [layer, radius, visitorOnly, gi, nogi, todayOnly, kids, category]);

  function nearMe() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter([lat, lng]);
        setCityId(null);
        setQuery("");
        void search({ lat, lng, cityId: null, q: "" }).finally(() =>
          setLocating(false),
        );
      },
      () => {
        setLocating(false);
        setHasSearched(true);
        setAcademies([]);
        setStores([]);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const pins = (layer === "stores" ? stores : academies)
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => ({
      id: item.id,
      name: item.name,
      lat: item.lat as number,
      lng: item.lng as number,
      slug: "slug" in item ? item.slug : undefined,
      detail:
        "category" in item
          ? item.category
          : item.professorName || item.city || t("searchAcademies"),
    }));

  const count = layer === "stores" ? stores.length : academies.length;
  const nextRadius = radius === 5 ? 10 : radius === 10 ? 25 : 25;

  function selectPin(id: string) {
    setSelectedId(id);
    setSheet("mid");
    requestAnimationFrame(() => {
      document
        .getElementById(`academy-card-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  const listContent = (
    <>
      {loading || locating ? (
        <div className="grid gap-2.5">
          <AcademyCardSkeleton />
          <AcademyCardSkeleton />
          <AcademyCardSkeleton />
        </div>
      ) : null}

      {!loading && !locating && count === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-[13px] text-[var(--mute)]">
          {!hasSearched
            ? t("emptyOrient")
            : layer === "stores"
              ? t("emptyStores")
              : center
                ? t("emptyRadius", { radius, next: nextRadius })
                : t("emptyGeneric")}
        </p>
      ) : null}

      {!loading && layer === "academies" ? (
        <div className="grid gap-2.5">
          {academies.map((academy) => (
            <AcademyResultCard
              key={academy.id}
              academy={academy}
              selected={selectedId === academy.id}
              onSelect={() => selectPin(academy.id)}
              profile={profile}
            />
          ))}
        </div>
      ) : null}

      {!loading && layer === "stores" ? (
        <div className="grid gap-2.5">
          {stores.map((store) => (
            <article key={store.id} className="ui-card p-3.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-[14px] font-semibold">{store.name}</h3>
                <span className="rounded-md bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                  {t("sponsored")}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[var(--mute)]">
                {[store.category, store.city, formatDistance(store.distanceKm)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3 px-4 py-3 sm:px-6 sm:py-5">
      <SegmentedControl
        ariaLabel={t("layerControl")}
        value={layer}
        onChange={(next) => {
          setLayer(next);
          setSelectedId(null);
        }}
        options={[
          { value: "academies", label: t("searchAcademies") },
          { value: "stores", label: t("searchStores") },
        ]}
      />

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void search({ q: query });
        }}
      >
        <label className="sr-only" htmlFor="home-search">
          {t("searchPlaceholder")}
        </label>
        <input
          id="home-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="ui-input min-h-11 flex-1"
        />
        <button
          type="button"
          onClick={nearMe}
          className="ui-btn inline-flex min-h-11 min-w-11 items-center justify-center border border-[var(--line)] bg-[var(--card)] text-[16px]"
          aria-label={t("nearMeAria")}
          title={t("nearMeAria")}
        >
          📍
        </button>
        <button type="submit" className="ui-btn ui-btn-primary min-h-11 px-4">
          {t("searchButton")}
        </button>
      </form>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {radii.map((value) => (
          <Chip
            key={value}
            active={radius === value}
            onClick={() => setRadius(value)}
          >
            {value} km
          </Chip>
        ))}
        {layer === "academies" ? (
          <>
            <Chip active={visitorOnly} onClick={() => setVisitorOnly((v) => !v)}>
              {t("filterVisitor")}
            </Chip>
            <Chip active={gi} onClick={() => setGi((v) => !v)}>
              {t("filterGi")}
            </Chip>
            <Chip active={nogi} onClick={() => setNogi((v) => !v)}>
              {t("filterNogi")}
            </Chip>
            <Chip active={todayOnly} onClick={() => setTodayOnly((v) => !v)}>
              {t("filterToday")}
            </Chip>
            <Chip active={kids} onClick={() => setKids((v) => !v)}>
              {t("filterKids")}
            </Chip>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {(locating || loading) && hasSearched ? (
        <p className="text-[12px] text-[var(--mute)]" role="status">
          {locating ? t("locating") : t("searchingArea")}
        </p>
      ) : null}

      <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative min-h-[45vh] overflow-hidden rounded-2xl border border-[var(--line)] lg:min-h-[560px]">
          <ResultMap
            pins={pins}
            center={center}
            zoom={center ? 12 : pins.length ? undefined : 2}
            selectedId={selectedId}
            onSelect={selectPin}
            className="h-[45vh] w-full lg:h-full lg:min-h-[560px]"
          />
          <MapSnapSheet
            state={sheet}
            onStateChange={setSheet}
            title={t("resultsTitle")}
            countLabel={t("resultsCount", { n: count })}
          >
            {listContent}
          </MapSnapSheet>
        </div>

        <aside className="hidden max-h-[560px] overflow-y-auto lg:block">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold">{t("resultsTitle")}</h2>
            <span className="text-[12px] text-[var(--mute)]">
              {t("resultsCount", { n: count })}
            </span>
          </div>
          {listContent}
        </aside>
      </div>
    </section>
  );
}
