import { City, Country, State } from "country-state-city";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ptLocale from "i18n-iso-countries/langs/pt.json";
import { localeTag, type Locale } from "@/lib/i18n/config";

countries.registerLocale(enLocale);
countries.registerLocale(ptLocale);

export type WorldCountry = { iso2: string; name: string };
export type WorldState = { isoCode: string; name: string; countryCode: string };
export type WorldCity = { name: string; stateCode: string; countryCode: string };

/** English display names for Brazilian states (CSC stores Portuguese). */
const brStateEn: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Federal District",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

function sortLocale(locale: Locale) {
  return localeTag(locale);
}

export function localizeCountryName(iso2: string, locale: Locale) {
  const code = iso2.toUpperCase();
  const lang = locale === "pt" ? "pt" : "en";
  return (
    countries.getName(code, lang, { select: "official" }) ||
    countries.getName(code, lang) ||
    Country.getCountryByCode(code)?.name ||
    code
  );
}

export function localizeStateName(
  countryIso2: string,
  stateIsoCode: string,
  nativeName: string,
  locale: Locale,
) {
  if (countryIso2.toUpperCase() === "BR" && locale === "en") {
    return brStateEn[stateIsoCode.toUpperCase()] ?? nativeName;
  }
  return nativeName;
}

export function listWorldCountries(locale: Locale = "pt"): WorldCountry[] {
  const tag = sortLocale(locale);
  return Country.getAllCountries()
    .map((country) => ({
      iso2: country.isoCode,
      name: localizeCountryName(country.isoCode, locale),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, tag));
}

export function listWorldStates(
  countryIso2: string,
  locale: Locale = "pt",
): WorldState[] {
  const tag = sortLocale(locale);
  const code = countryIso2.toUpperCase();
  return State.getStatesOfCountry(code)
    .map((state) => ({
      isoCode: state.isoCode,
      name: localizeStateName(code, state.isoCode, state.name, locale),
      countryCode: state.countryCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, tag));
}

export function listWorldCities(
  countryIso2: string,
  stateIsoCode: string,
  locale: Locale = "pt",
): WorldCity[] {
  const tag = sortLocale(locale);
  return City.getCitiesOfState(countryIso2.toUpperCase(), stateIsoCode)
    .map((city) => ({
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, tag));
}

export function getWorldCountryName(iso2: string, locale: Locale = "pt") {
  return localizeCountryName(iso2, locale);
}

export function getWorldStateName(
  countryIso2: string,
  stateIsoCode: string,
  locale: Locale = "pt",
) {
  const native =
    State.getStateByCodeAndCountry(stateIsoCode, countryIso2.toUpperCase())
      ?.name ?? stateIsoCode;
  return localizeStateName(countryIso2, stateIsoCode, native, locale);
}
