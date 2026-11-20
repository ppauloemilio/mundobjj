"use client";

import { useEffect, useState } from "react";
import { LocationFields } from "@/components/location-fields";
import { useLocale } from "@/components/locale-provider";

type AddressValues = {
  countryIso2?: string | null;
  stateCode?: string | null;
  cityName?: string | null;
  postalCode?: string | null;
  street?: string | null;
  streetNumber?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
};

function formatCep(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function AddressFields({
  initial,
  required = false,
}: {
  initial?: AddressValues;
  required?: boolean;
}) {
  const { locale, t } = useLocale();
  const [country, setCountry] = useState(initial?.countryIso2 || "");
  const [countries, setCountries] = useState<{ iso2: string; name: string }[]>(
    [],
  );
  const [cep, setCep] = useState(
    initial?.postalCode ? formatCep(initial.postalCode) : "",
  );
  const [street, setStreet] = useState(initial?.street || "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood || "");
  const [streetNumber, setStreetNumber] = useState(initial?.streetNumber || "");
  const [complement, setComplement] = useState(initial?.complement || "");
  const [stateCode, setStateCode] = useState(initial?.stateCode || "");
  const [cityName, setCityName] = useState(initial?.cityName || "");
  const [cepStatus, setCepStatus] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const isBrazil = country === "BR";

  useEffect(() => {
    void fetch(`/api/geo?locale=${locale}`)
      .then((response) => response.json())
      .then((data: { countries: { iso2: string; name: string }[] }) =>
        setCountries(data.countries ?? []),
      );
  }, [locale]);

  async function lookupCep(nextCep: string) {
    const digits = nextCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepStatus(t("cepLooking"));
    try {
      const response = await fetch(`/api/cep?cep=${digits}`);
      const data = (await response.json()) as {
        error?: string;
        street?: string;
        neighborhood?: string;
        city?: string;
        stateCode?: string;
      };
      if (!response.ok || data.error) {
        setCepStatus(data.error || t("cepNotFound"));
        return;
      }
      setStreet(data.street || "");
      setNeighborhood(data.neighborhood || "");
      setStateCode(data.stateCode || "");
      setCityName(data.city || "");
      setCepStatus(t("cepFilled"));
    } catch {
      setCepStatus(t("cepFail"));
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex flex-col gap-1 text-[13px]">
        {t("country")}
        <select
          value={country}
          required={required}
          onChange={(event) => {
            const next = event.target.value;
            setCountry(next);
            setCep("");
            setCepStatus("");
            setStateCode("");
            setCityName("");
            setStreet("");
            setNeighborhood("");
          }}
          className="ui-input"
        >
          <option value="">{t("searchSelect")}</option>
          {countries.map((item) => (
            <option key={item.iso2} value={item.iso2}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      {!country ? (
        <p className="text-[12px] text-[var(--muted)]">{t("addressCountryHint")}</p>
      ) : null}

      {isBrazil ? (
        <>
          <input type="hidden" name="countryMode" value="list" />
          <input type="hidden" name="stateMode" value="list" />
          <input type="hidden" name="cityMode" value="list" />
          <input type="hidden" name="countryIso2" value="BR" />
          <input type="hidden" name="stateCode" value={stateCode} />
          <input type="hidden" name="cityName" value={cityName} />

          <label className="flex flex-col gap-1 text-[13px]">
            {t("postalCode")}
            <input
              name="postalCode"
              value={cep}
              required={required}
              inputMode="numeric"
              placeholder="00000-000"
              onChange={(event) => {
                const next = formatCep(event.target.value);
                setCep(next);
                if (next.replace(/\D/g, "").length === 8) {
                  void lookupCep(next);
                }
              }}
              className="ui-input"
            />
            {cepStatus ? (
              <span className="text-[11px] text-[var(--muted)]">
                {cepLoading ? t("cepLooking") : cepStatus}
              </span>
            ) : null}
          </label>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <ReadOnlyField label={t("stateUf")} value={stateCode} />
            <ReadOnlyField label={t("city")} value={cityName} />
          </div>

          <TextField
            label={t("street")}
            name="street"
            value={street}
            onChange={setStreet}
            required={required}
          />
          <TextField
            label={t("neighborhood")}
            name="neighborhood"
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </>
      ) : null}

      {country && !isBrazil ? (
        <>
          <LocationFields
            key={`${country}-${locale}`}
            hideCountry
            initialCountryIso2={country}
            initialStateCode={stateCode}
            initialCityName={cityName}
            required={required}
          />
          <TextField
            label={t("street")}
            name="street"
            value={street}
            onChange={setStreet}
            required={required}
          />
          <TextField
            label={t("neighborhood")}
            name="neighborhood"
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </>
      ) : null}

      {country ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <TextField
            label={t("streetNumber")}
            name="streetNumber"
            value={streetNumber}
            onChange={setStreetNumber}
            required={required}
          />
          <TextField
            label={t("complement")}
            name="complement"
            value={complement}
            onChange={setComplement}
            placeholder={t("complementPlaceholder")}
          />
        </div>
      ) : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <input
        value={value}
        readOnly
        className="ui-input bg-[var(--accent-soft)]"
      />
    </label>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <input
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="ui-input"
      />
    </label>
  );
}
