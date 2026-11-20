"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { academies, profiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
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

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      email,
      role: parsed.data.role,
    })
    .where(eq(users.id, parsed.data.userId));

  await db
    .update(profiles)
    .set({ name: parsed.data.name })
    .where(eq(profiles.userId, parsed.data.userId));

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  return { success: "Usuário atualizado." };
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

export async function updateAcademyAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const parsed = z
    .object({
      academyId: z.string().uuid(),
      name: z.string().trim().min(2),
      professorName: z.string().trim().optional(),
      whatsapp: z.string().trim().optional(),
      address: z.string().trim().optional(),
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      academyId: formData.get("academyId"),
      name: formData.get("name"),
      professorName: formData.get("professorName") || "",
      whatsapp: formData.get("whatsapp") || "",
      address: formData.get("address") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  await db
    .update(academies)
    .set({
      name: parsed.data.name,
      professorName: parsed.data.professorName || null,
      whatsapp: parsed.data.whatsapp || null,
      address: parsed.data.address || null,
      acceptsVisitor: Boolean(parsed.data.acceptsVisitor),
    })
    .where(eq(academies.id, parsed.data.academyId));

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
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
