"use server";

import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { homePathForUser, signIn, signOut } from "@/auth";
import { requireDb } from "@/db";
import {
  academies,
  academySuggestions,
  memberships,
  profiles,
  users,
} from "@/db/schema";
import {
  readLocationFromForm,
  saveLocationSuggestions,
} from "@/lib/location-input";
import { uniqueSlug } from "@/lib/slug";

const baseSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(6, "Informe a senha."),
});

export type AuthFormState = {
  error?: string;
};

async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  accountType: "athlete" | "academy";
}) {
  const db = requireDb();
  const email = input.email.toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { error: "Já existe uma conta com este e-mail." as const };
  }

  const passwordHash = await hash(input.password, 10);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    name: input.name,
    email,
    passwordHash,
    accountType: input.accountType,
    role: "user",
  });

  const [profile] = await db
    .insert(profiles)
    .values({
      userId,
      name: input.name,
      slug: uniqueSlug(input.name),
    })
    .returning();

  return { userId, profileId: profile.id, email };
}

export async function registerAthleteAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = baseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const academyMode = String(formData.get("academyMode") || "list");
  const academyId = String(formData.get("academyId") || "");
  const suggestedAcademyName = String(
    formData.get("suggestedAcademyName") || "",
  ).trim();

  if (academyMode === "other" && suggestedAcademyName.length < 2) {
    return { error: "Informe o nome da academia." };
  }

  const created = await createAccount({
    ...parsed.data,
    accountType: "athlete",
  });
  if ("error" in created) return created;

  const location = readLocationFromForm(formData);
  const cityId = await saveLocationSuggestions(location, created.userId);
  const db = requireDb();

  if (cityId) {
    await db
      .update(profiles)
      .set({ cityId })
      .where(eq(profiles.id, created.profileId));
  }

  if (academyMode === "other" && suggestedAcademyName) {
    await db.insert(academySuggestions).values({
      name: suggestedAcademyName,
      suggestedByUserId: created.userId,
      contact: parsed.data.email,
      cityText: location.customCity || null,
    });
  } else if (academyId) {
    const [academy] = await db
      .select({ id: academies.id })
      .from(academies)
      .where(and(eq(academies.id, academyId)))
      .limit(1);
    if (academy) {
      await db.insert(memberships).values({
        profileId: created.profileId,
        academyId: academy.id,
        status: "active",
        startedAt: new Date().toISOString().slice(0, 10),
      });
    }
  }

  try {
    await signIn("credentials", {
      email: created.email,
      password: parsed.data.password,
      redirectTo: "/painel",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas o login automático falhou. Entre de novo." };
    }
    throw error;
  }

  return {};
}

export async function registerAcademyAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = baseSchema
    .extend({
      academyName: z.string().trim().min(2, "Informe o nome da academia."),
      whatsapp: z.string().trim().optional(),
      address: z.string().trim().min(5, "Informe o endereço."),
      professorName: z.string().trim().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      academyName: formData.get("academyName"),
      whatsapp: formData.get("whatsapp") || "",
      address: formData.get("address"),
      professorName: formData.get("professorName") || "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const created = await createAccount({
    name: parsed.data.name,
    email: parsed.data.email,
    password: parsed.data.password,
    accountType: "academy",
  });
  if ("error" in created) return created;

  const location = readLocationFromForm(formData);
  const cityId = await saveLocationSuggestions(location, created.userId);
  const db = requireDb();

  await db.insert(academies).values({
    slug: uniqueSlug(parsed.data.academyName),
    name: parsed.data.academyName,
    professorName: parsed.data.professorName || parsed.data.name,
    whatsapp: parsed.data.whatsapp || null,
    address: parsed.data.address,
    cityId,
    ownerId: created.userId,
    acceptsVisitor: true,
  });

  try {
    await signIn("credentials", {
      email: created.email,
      password: parsed.data.password,
      redirectTo: "/painel/academia",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas o login automático falhou. Entre de novo." };
    }
    throw error;
  }

  return {};
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const email = parsed.data.email.toLowerCase();
  const [user] = await db
    .select({
      role: users.role,
      accountType: users.accountType,
      blockedAt: users.blockedAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user?.passwordHash || user.blockedAt) {
    return { error: "E-mail ou senha incorretos." };
  }

  const redirectTo = homePathForUser(user);

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha incorretos." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
  redirect("/");
}
