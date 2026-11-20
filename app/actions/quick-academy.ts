"use server";

import { hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { signIn } from "@/auth";
import { requireDb } from "@/db";
import { academies, cities, profiles, states, users } from "@/db/schema";
import { createClaimToken } from "@/lib/claim-token";
import { geocodeAddress } from "@/lib/geocode";
import {
  readLocationFromForm,
  saveLocationSuggestions,
} from "@/lib/location-input";
import { uniqueSlug } from "@/lib/slug";

export type QuickAcademyState = {
  error?: string;
  success?: string;
  claimToken?: string;
  slug?: string;
};

const quickSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da academia."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  address: z.string().trim().min(5, "Informe o endereço."),
  neighborhood: z.string().trim().optional(),
  professorName: z.string().trim().optional(),
  affiliation: z.string().trim().optional(),
});

export async function quickRegisterAcademyAction(
  _prev: QuickAcademyState,
  formData: FormData,
): Promise<QuickAcademyState> {
  const parsed = quickSchema.safeParse({
    name: formData.get("name"),
    whatsapp: formData.get("whatsapp"),
    address: formData.get("address"),
    neighborhood: formData.get("neighborhood") || "",
    professorName: formData.get("professorName") || "",
    affiliation: formData.get("affiliation") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const location = readLocationFromForm(formData);
  const cityId = await saveLocationSuggestions(location, null);
  if (!cityId && !location.customCity) {
    return { error: "Selecione a cidade ou use Outro." };
  }

  const db = requireDb();
  let placeName = "";
  if (cityId) {
    const [place] = await db
      .select({
        city: cities.name,
        stateCode: states.code,
        state: states.name,
      })
      .from(cities)
      .innerJoin(states, eq(cities.stateId, states.id))
      .where(eq(cities.id, cityId))
      .limit(1);
    if (place) {
      placeName = [place.city, place.stateCode, place.state]
        .filter(Boolean)
        .join(", ");
    }
  }

  const query = [
    parsed.data.address,
    parsed.data.neighborhood,
    placeName,
    location.customCity,
    location.customState,
    location.customCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const coords = await geocodeAddress(query);
  const claimToken = createClaimToken();

  const [created] = await db
    .insert(academies)
    .values({
      slug: uniqueSlug(parsed.data.name),
      name: parsed.data.name,
      affiliation: parsed.data.affiliation || null,
      professorName: parsed.data.professorName || null,
      whatsapp: parsed.data.whatsapp,
      address: parsed.data.address,
      neighborhood: parsed.data.neighborhood || null,
      ...(cityId ? { cityId } : {}),
      lat: coords ? String(coords.lat) : null,
      lng: coords ? String(coords.lng) : null,
      acceptsVisitor: true,
      ownerId: null,
      claimToken,
    })
    .returning({ slug: academies.slug, claimToken: academies.claimToken });

  revalidatePath("/");
  return {
    success:
      "Academia cadastrada. Guarde o código de reivindicação para a academia assumir o acesso.",
    claimToken: created.claimToken ?? claimToken,
    slug: created.slug,
  };
}

const claimSchema = z.object({
  claimToken: z.string().trim().min(6, "Informe o código de reivindicação."),
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

export async function claimAcademyAction(
  _prev: QuickAcademyState,
  formData: FormData,
): Promise<QuickAcademyState> {
  const parsed = claimSchema.safeParse({
    claimToken: formData.get("claimToken"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const token = parsed.data.claimToken.trim().toUpperCase();
  const [academy] = await db
    .select({
      id: academies.id,
      name: academies.name,
      slug: academies.slug,
      ownerId: academies.ownerId,
      claimToken: academies.claimToken,
    })
    .from(academies)
    .where(and(eq(academies.claimToken, token), isNull(academies.ownerId)))
    .limit(1);

  if (!academy) {
    return {
      error:
        "Código inválido ou esta academia já foi reivindicada. Confira o código ou fale com o suporte.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "Já existe uma conta com este e-mail. Entre e fale com o admin." };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hash(parsed.data.password, 10);

  await db.insert(users).values({
    id: userId,
    name: parsed.data.name,
    email,
    passwordHash,
    accountType: "academy",
    role: "user",
  });

  await db.insert(profiles).values({
    userId,
    name: parsed.data.name,
    slug: uniqueSlug(parsed.data.name),
  });

  await db
    .update(academies)
    .set({
      ownerId: userId,
      claimToken: null,
      claimedAt: new Date(),
    })
    .where(eq(academies.id, academy.id));

  revalidatePath("/");
  revalidatePath(`/academia/${academy.slug}`);
  revalidatePath("/painel/academia");

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/painel/academia",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success:
          "Academia reivindicada. Conta criada — entre com o e-mail e a senha informados.",
        slug: academy.slug,
      };
    }
    throw error;
  }

  return {};
}