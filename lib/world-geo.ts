import { City, Country, State } from "country-state-city";

export type WorldCountry = { iso2: string; name: string };
export type WorldState = { isoCode: string; name: string; countryCode: string };
export type WorldCity = { name: string; stateCode: string; countryCode: string };

export function listWorldCountries(): WorldCountry[] {
  return Country.getAllCountries()
    .map((country) => ({
      iso2: country.isoCode,
      name: country.name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function listWorldStates(countryIso2: string): WorldState[] {
  return State.getStatesOfCountry(countryIso2.toUpperCase())
    .map((state) => ({
      isoCode: state.isoCode,
      name: state.name,
      countryCode: state.countryCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function listWorldCities(
  countryIso2: string,
  stateIsoCode: string,
): WorldCity[] {
  return City.getCitiesOfState(countryIso2.toUpperCase(), stateIsoCode)
    .map((city) => ({
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function getWorldCountryName(iso2: string) {
  return Country.getCountryByCode(iso2.toUpperCase())?.name ?? iso2;
}

export function getWorldStateName(countryIso2: string, stateIsoCode: string) {
  return (
    State.getStateByCodeAndCountry(stateIsoCode, countryIso2.toUpperCase())
      ?.name ?? stateIsoCode
  );
}