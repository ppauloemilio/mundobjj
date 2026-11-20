"use client";

import { useEffect, useState } from "react";
import { LocationFields } from "@/components/location-fields";

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
    void fetch("/api/geo")
      .then((response) => response.json())
      .then((data: { countries: { iso2: string; name: string }[] }) =>
        setCountries(data.countries ?? []),
      );
  }, []);

  async function lookupCep(nextCep: string) {
    const digits = nextCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    setCepStatus("Buscando CEP...");
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
        setCepStatus(data.error || "CEP não encontrado.");
        return;
      }
      setStreet(data.street || "");
      setNeighborhood(data.neighborhood || "");
      setStateCode(data.stateCode || "");
      setCityName(data.city || "");
      setCepStatus("Endereço preenchido. Confira e complete o número.");
    } catch {
      setCepStatus("Falha ao consultar CEP.");
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        País
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
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        >
          <option value="">Selecione</option>
          {countries.map((item) => (
            <option key={item.iso2} value={item.iso2}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      {!country ? (
        <p className="text-sm text-[var(--muted)]">
          Selecione o país. No Brasil usamos CEP; nos demais, estado e cidade da
          base mundial (country-state-city).
        </p>
      ) : null}

      {isBrazil ? (
        <>
          <input type="hidden" name="countryMode" value="list" />
          <input type="hidden" name="stateMode" value="list" />
          <input type="hidden" name="cityMode" value="list" />
          <input type="hidden" name="countryIso2" value="BR" />
          <input type="hidden" name="stateCode" value={stateCode} />
          <input type="hidden" name="cityName" value={cityName} />

          <label className="flex flex-col gap-1 text-sm">
            CEP
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
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
            />
            {cepStatus ? (
              <span className="text-xs text-[var(--muted)]">
                {cepLoading ? "Buscando..." : cepStatus}
              </span>
            ) : null}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Estado (UF)" value={stateCode} />
            <ReadOnlyField label="Cidade" value={cityName} />
          </div>

          <TextField
            label="Rua / logradouro"
            name="street"
            value={street}
            onChange={setStreet}
            required={required}
          />
          <TextField
            label="Bairro"
            name="neighborhood"
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </>
      ) : null}

      {country && !isBrazil ? (
        <>
          <LocationFields
            key={country}
            hideCountry
            initialCountryIso2={country}
            initialStateCode={stateCode}
            initialCityName={cityName}
            required={required}
          />
          <TextField
            label="Rua / logradouro"
            name="street"
            value={street}
            onChange={setStreet}
            required={required}
          />
          <TextField
            label="Bairro"
            name="neighborhood"
            value={neighborhood}
            onChange={setNeighborhood}
          />
        </>
      ) : null}

      {country ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Número"
            name="streetNumber"
            value={streetNumber}
            onChange={setStreetNumber}
            required={required}
          />
          <TextField
            label="Complemento"
            name="complement"
            value={complement}
            onChange={setComplement}
            placeholder="Apto, sala, bloco..."
          />
        </div>
      ) : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        value={value}
        readOnly
        className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--accent-soft)] px-3"
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
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}