"use server";

import { hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { requireDb } from "@/db";
import {
  academies,
  academySuggestions,
  memberships,
  profiles,
  users,
} from "@/db/schema";
import { saveAthleteProfessorLink } from "@/lib/athlete-professor";
import {
  readLocationFromForm,
  resolveLocationToCityId,
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
  /** Full page navigation after session cookie changes (avoids soft-nav crash). */
  redirectTo?: string;
};

async function signInWithoutSoftRedirect(
  email: string,
  password: string,
  redirectTo: string,
  failMessage: string,
): Promise<AuthFormState> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: failMessage };
    }
    throw error;
  }
  return { redirectTo };
}

async function createAccount(input: {
  name: string;
  email: string;
  password: string;
  accountType: "athlete" | "academy" | "professor"; // nunca "admin" via cadastro público
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
      contactEmail: email,
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
  const cityId = await resolveLocationToCityId(location, created.userId);
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

      const professorProfileId = String(
        formData.get("professorProfileId") || "",
      );
      if (professorProfileId) {
        const linked = await saveAthleteProfessorLink(db, {
          profileId: created.profileId,
          academyId: academy.id,
          professorProfileId,
        });
        if (linked.error) return { error: linked.error };
      }
    }
  }

  return signInWithoutSoftRedirect(
    created.email,
    parsed.data.password,
    "/painel",
    "Conta criada, mas o login automático falhou. Entre de novo.",
  );
}

export async function registerAcademyAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = baseSchema
    .extend({
      academyName: z.string().trim().min(2, "Informe o nome da academia."),
      whatsapp: z.string().trim().optional(),
    })
    .safeParse({
      name: formData.get("academyName"),
      email: formData.get("email"),
      password: formData.get("password"),
      academyName: formData.get("academyName"),
      whatsapp: formData.get("whatsapp") || "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const created = await createAccount({
    name: parsed.data.academyName,
    email: parsed.data.email,
    password: parsed.data.password,
    accountType: "academy",
  });
  if ("error" in created) return created;

  const db = requireDb();

  await db.insert(academies).values({
    slug: uniqueSlug(parsed.data.academyName),
    name: parsed.data.academyName,
    whatsapp: parsed.data.whatsapp || null,
    ownerId: created.userId,
    acceptsVisitor: false,
  });

  return signInWithoutSoftRedirect(
    created.email,
    parsed.data.password,
    "/painel/academia",
    "Conta criada, mas o login automático falhou. Entre de novo.",
  );
}

export async function registerProfessorAction(
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

  const created = await createAccount({
    ...parsed.data,
    accountType: "professor",
  });
  if ("error" in created) return created;

  const location = readLocationFromForm(formData);
  const cityId = await resolveLocationToCityId(location, created.userId);
  const db = requireDb();

  if (cityId) {
    await db
      .update(profiles)
      .set({ cityId })
      .where(eq(profiles.id, created.profileId));
  }

  return signInWithoutSoftRedirect(
    created.email,
    parsed.data.password,
    "/painel/professor",
    "Conta criada, mas o login automático falhou. Entre de novo.",
  );
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
      id: users.id,
      role: users.role,
      accountType: users.accountType,
      blockedAt: users.blockedAt,
      suspendedAt: users.suspendedAt,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user?.passwordHash || user.blockedAt || user.suspendedAt) {
    return { error: "E-mail ou senha incorretos." };
  }

  const { postLoginPathForUser } = await import("@/auth");
  const redirectTo = await postLoginPathForUser(user);

  return signInWithoutSoftRedirect(
    email,
    parsed.data.password,
    redirectTo,
    "E-mail ou senha incorretos.",
  );
}

export async function logoutAction() {
  await signOut({ redirect: false });
}
