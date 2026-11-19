import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  businessCategories,
  cities,
  countries,
  states,
} from "./schema";

config({ path: ".env.local" });
config();

const countrySeed = [
  { iso2: "BR", name: "Brasil" },
  { iso2: "PT", name: "Portugal" },
  { iso2: "US", name: "Estados Unidos" },
  { iso2: "JP", name: "Japão" },
  { iso2: "AE", name: "Emirados Árabes" },
  { iso2: "ES", name: "Espanha" },
];

const brazilStates: [string, string, string[]][] = [
  ["AC", "Acre", ["Rio Branco"]],
  ["AL", "Alagoas", ["Maceió"]],
  ["AP", "Amapá", ["Macapá"]],
  ["AM", "Amazonas", ["Manaus"]],
  ["BA", "Bahia", ["Salvador"]],
  ["CE", "Ceará", ["Fortaleza"]],
  ["DF", "Distrito Federal", ["Brasília"]],
  ["ES", "Espírito Santo", ["Vitória"]],
  ["GO", "Goiás", ["Goiânia"]],
  ["MA", "Maranhão", ["São Luís"]],
  ["MT", "Mato Grosso", ["Cuiabá"]],
  ["MS", "Mato Grosso do Sul", ["Campo Grande"]],
  ["MG", "Minas Gerais", ["Belo Horizonte", "Uberlândia"]],
  ["PA", "Pará", ["Belém"]],
  ["PB", "Paraíba", ["João Pessoa"]],
  ["PR", "Paraná", ["Curitiba", "Londrina"]],
  ["PE", "Pernambuco", ["Recife"]],
  ["PI", "Piauí", ["Teresina"]],
  ["RJ", "Rio de Janeiro", ["Rio de Janeiro", "Niterói"]],
  ["RN", "Rio Grande do Norte", ["Natal"]],
  ["RS", "Rio Grande do Sul", ["Porto Alegre"]],
  ["RO", "Rondônia", ["Porto Velho"]],
  ["RR", "Roraima", ["Boa Vista"]],
  ["SC", "Santa Catarina", ["Florianópolis", "Joinville", "Balneário Camboriú"]],
  [
    "SP",
    "São Paulo",
    [
      "São Paulo",
      "Campinas",
      "Guarulhos",
      "Santos",
      "São José dos Campos",
      "Ribeirão Preto",
    ],
  ],
  ["SE", "Sergipe", ["Aracaju"]],
  ["TO", "Tocantins", ["Palmas"]],
];

const otherPlaces: [string, string, string, string[]][] = [
  ["PT", "Lisboa", "Lisboa", ["Lisboa"]],
  ["US", "CA", "Califórnia", ["Los Angeles"]],
  ["US", "NY", "Nova York", ["Nova York"]],
  ["JP", "Tokyo", "Tóquio", ["Tóquio"]],
  ["AE", "DU", "Dubai", ["Dubai"]],
  ["ES", "MD", "Madri", ["Madri"]],
];

const categories = [
  { slug: "equipamento", name: "Equipamento", sortOrder: 1 },
  { slug: "nutricao", name: "Nutrição", sortOrder: 2 },
  { slug: "kimono", name: "Kimono", sortOrder: 3 },
];

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Defina DATABASE_URL_UNPOOLED ou DATABASE_URL no .env.local.");
  }

  const db = drizzle(neon(url));

  await db.insert(countries).values(countrySeed).onConflictDoNothing({
    target: countries.iso2,
  });

  const countryRows = await db.select().from(countries);
  const countryId = new Map(countryRows.map((row) => [row.iso2, row.id]));
  const brazilId = countryId.get("BR");
  if (!brazilId) throw new Error("País BR não encontrado depois do seed.");

  for (const [code, name] of brazilStates) {
    await db
      .insert(states)
      .values({ countryId: brazilId, code, name })
      .onConflictDoNothing({ target: [states.countryId, states.code] });
  }

  for (const [iso2, code, name] of otherPlaces) {
    const id = countryId.get(iso2);
    if (!id) continue;
    await db
      .insert(states)
      .values({ countryId: id, code, name })
      .onConflictDoNothing({ target: [states.countryId, states.code] });
  }

  const stateRows = await db.select().from(states);
  const stateId = new Map(
    stateRows.map((row) => [`${row.countryId}:${row.code}`, row.id]),
  );

  for (const [code, , cityNames] of brazilStates) {
    const id = stateId.get(`${brazilId}:${code}`);
    if (!id) continue;
    for (const name of cityNames) {
      await db
        .insert(cities)
        .values({ stateId: id, name })
        .onConflictDoNothing({ target: [cities.stateId, cities.name] });
    }
  }

  for (const [iso2, code, , cityNames] of otherPlaces) {
    const country = countryId.get(iso2);
    const id = country ? stateId.get(`${country}:${code}`) : undefined;
    if (!id) continue;
    for (const name of cityNames) {
      await db
        .insert(cities)
        .values({ stateId: id, name })
        .onConflictDoNothing({ target: [cities.stateId, cities.name] });
    }
  }

  await db
    .insert(businessCategories)
    .values(categories)
    .onConflictDoNothing({ target: businessCategories.slug });

  const savedCategories = await db
    .select({ slug: businessCategories.slug })
    .from(businessCategories)
    .where(eq(businessCategories.active, true));

  console.log(
    `Seed concluído. Categorias ativas: ${savedCategories.map((row) => row.slug).join(", ")}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
