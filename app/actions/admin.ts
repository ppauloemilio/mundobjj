"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { academies, cities, profiles, states, users } from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import {
  readLocationFromForm,
  saveLocationSuggestions,
} from "@/lib/location-input";
import {
  readProfessorFromForm,
  resolveResponsibleProfessor,
} from "@/lib/professor-input";
import { requireAdmin } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import {
  randomTemporaryPassword,
  whatsappChatUrl,
} from "@/lib/whatsapp";

export type AdminFormState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
  whatsappUrl?: string;
};

async function resolveUserWhatsapp(userId: string) {
  const db = requireDb();
  const [profile] = await db
    .select({ whatsapp: profiles.whatsapp, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  if (profile?.whatsapp) {
    return { whatsapp: profile.whatsapp, label: profile.name };
  }

  const [academy] = await db
    .select({ whatsapp: academies.whatsapp, name: academies.name })
    .from(academies)
    .where(eq(academies.ownerId, userId))
    .limit(1);

  if (academy?.whatsapp) {
    return { whatsapp: academy.whatsapp, label: academy.name };
  }

  return null;
}

async function applyPassword(
  userId: string,
  temporaryPassword: string,
  viaWhatsApp: boolean,
): Promise<AdminFormState> {
  const passwordHash = await hash(temporaryPassword, 10);
  const db = requireDb();
  const [user] = await db
    .select({
      email: users.email,
      name: users.name,
      accountType: users.accountType,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "Usuário não encontrado." };

  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  const contact = await resolveUserWhatsapp(userId);
  const message = [
    `Olá${contact?.label ? ` ${contact.label}` : ""}!`,
    "Sua senha no Mundo BJJ foi redefinida pelo administrador.",
    `E-mail: ${user.email}`,
    `Nova senha: ${temporaryPassword}`,
    "Entre em https://mundobjj.vercel.app/entrar e altere a senha no painel.",
  ].join("\n");

  const whatsappUrl = whatsappChatUrl(contact?.whatsapp, message);

  if (viaWhatsApp && !whatsappUrl) {
    return {
      error:
        "Senha redefinida, mas não há WhatsApp cadastrado para este usuário/academia. Copie a senha e envie manualmente.",
      temporaryPassword,
    };
  }

  revalidatePath("/admin/usuarios");
  return {
    success: viaWhatsApp
      ? "Senha gerada. Abra o WhatsApp para enviar."
      : "Senha definida. Copie e envie ao usuário.",
    temporaryPassword,
    whatsappUrl: whatsappUrl ?? undefined,
  };
}

export async function updateUserAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = z
    .object({
      userId: z.string().min(1),
      name: z.string().trim().min(2),
      email: z.string().trim().email(),
      role: z.enum(["user", "admin"]),
    })
    .safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const email = parsed.data.email.toLowerCase();
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (taken && taken.id !== parsed.data.userId) {
    return { error: "Já existe outro usuário com este e-mail." };
  }

  const nextRole = parsed.data.role;
  const [current] = await db
    .select({ accountType: users.accountType })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1);

  // Conta admin é só gestão — não mistura com atleta/academia/professor.
  const nextAccountType =
    nextRole === "admin"
      ? ("admin" as const)
      : current?.accountType === "admin"
        ? ("athlete" as const)
        : current?.accountType;

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      email,
      role: nextRole,
      ...(nextAccountType ? { accountType: nextAccountType } : {}),
    })
    .where(eq(users.id, parsed.data.userId));

  if (nextRole !== "admin") {
    await db
      .update(profiles)
      .set({ name: parsed.data.name })
      .where(eq(profiles.userId, parsed.data.userId));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  return {
    success:
      nextRole === "admin"
        ? "Usuário promovido a admin de gestão (sem painel de atleta)."
        : "Usuário atualizado.",
  };
}

export async function toggleUserBlockAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const block = formData.get("block") === "1";

  if (!userId) return;
  if (userId === admin.id) return;

  const db = requireDb();
  await db
    .update(users)
    .set({ blockedAt: block ? new Date() : null })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}

export async function setUserPasswordAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const parsed = z
    .object({
      password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
    })
    .safeParse({ password: formData.get("password") });

  if (!userId) return { error: "Usuário inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Senha inválida." };
  }

  return applyPassword(userId, parsed.data.password, false);
}

export async function resetUserPasswordWhatsAppAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) return { error: "Usuário inválido." };

  return applyPassword(userId, randomTemporaryPassword(), true);
}

/** @deprecated use setUserPasswordAction / resetUserPasswordWhatsAppAction */
export async function resetUserPasswordAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  return resetUserPasswordWhatsAppAction(_prev, formData);
}

export async function createAcademyAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      name: z.string().trim().min(2, "Informe o nome da academia."),
      whatsapp: z.string().trim().optional(),
      address: z.string().trim().min(5, "Informe o endereço."),
      neighborhood: z.string().trim().optional(),
      affiliation: z.string().trim().optional(),
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp") || "",
      address: formData.get("address"),
      neighborhood: formData.get("neighborhood") || "",
      affiliation: formData.get("affiliation") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const professorInput = readProfessorFromForm(formData);
  if (
    professorInput.professorMode === "other" &&
    professorInput.suggestedProfessorName.length < 2
  ) {
    return { error: "Informe o nome do professor ou escolha na lista." };
  }

  const location = readLocationFromForm(formData);
  await saveLocationSuggestions(location, admin.id);
  const cityId = location.customCity ? null : location.cityId;
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

  const [created] = await db
    .insert(academies)
    .values({
      slug: uniqueSlug(parsed.data.name),
      name: parsed.data.name,
      affiliation: parsed.data.affiliation || null,
      professorName:
        professorInput.professorMode === "other"
          ? professorInput.suggestedProfessorName
          : null,
      whatsapp: parsed.data.whatsapp || null,
      address: parsed.data.address,
      neighborhood: parsed.data.neighborhood || null,
      ...(cityId ? { cityId } : {}),
      lat: coords ? String(coords.lat) : null,
      lng: coords ? String(coords.lng) : null,
      acceptsVisitor: Boolean(parsed.data.acceptsVisitor),
      ownerId: null,
    })
    .returning({ id: academies.id, slug: academies.slug });

  const professor = await resolveResponsibleProfessor(db, {
    ...professorInput,
    academyId: created.id,
    academyName: parsed.data.name,
    userId: admin.id,
    contact: parsed.data.whatsapp || null,
  });

  if (professor.professorName) {
    await db
      .update(academies)
      .set({ professorName: professor.professorName })
      .where(eq(academies.id, created.id));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
  revalidatePath("/admin/sugestoes");
  revalidatePath("/");
  return {
    success: `Academia cadastrada (${created.slug}). Sem dono ainda — o responsável pode solicitar acesso na ficha pública.`,
  };
}

export async function updateAcademyAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();

  const parsed = z
    .object({
      academyId: z.string().uuid(),
      name: z.string().trim().min(2),
      whatsapp: z.string().trim().optional(),
      address: z.string().trim().optional(),
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      academyId: formData.get("academyId"),
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp") || "",
      address: formData.get("address") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const professorInput = readProfessorFromForm(formData);
  const db = requireDb();
  const touchedProfessor =
    professorInput.professorMode === "other" ||
    Boolean(professorInput.professorProfileId);

  let professorName: string | null | undefined;
  if (touchedProfessor) {
    if (
      professorInput.professorMode === "other" &&
      professorInput.suggestedProfessorName.length < 2
    ) {
      return { error: "Informe o nome do professor ou escolha na lista." };
    }
    const professor = await resolveResponsibleProfessor(db, {
      ...professorInput,
      academyId: parsed.data.academyId,
      academyName: parsed.data.name,
      userId: admin.id,
      contact: parsed.data.whatsapp || null,
    });
    professorName = professor.professorName;
  }

  await db
    .update(academies)
    .set({
      name: parsed.data.name,
      ...(touchedProfessor ? { professorName: professorName ?? null } : {}),
      whatsapp: parsed.data.whatsapp || null,
      address: parsed.data.address || null,
      acceptsVisitor: Boolean(parsed.data.acceptsVisitor),
    })
    .where(eq(academies.id, parsed.data.academyId));

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
  revalidatePath("/admin/sugestoes");
  revalidatePath("/");
  return { success: "Academia atualizada." };
}

export async function toggleAcademyBlockAction(formData: FormData) {
  await requireAdmin();
  const academyId = String(formData.get("academyId") || "");
  const block = formData.get("block") === "1";
  if (!academyId) return;

  const db = requireDb();
  await db
    .update(academies)
    .set({ blockedAt: block ? new Date() : null })
    .where(eq(academies.id, academyId));

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
  revalidatePath("/");
}
