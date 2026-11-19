"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { academies, profiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export type AdminFormState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
};

function randomPassword() {
  return `Mbjj-${Math.random().toString(36).slice(2, 8)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
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

export async function resetUserPasswordAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) return { error: "Usuário inválido." };

  const temporaryPassword = randomPassword();
  const passwordHash = await hash(temporaryPassword, 10);
  const db = requireDb();

  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  revalidatePath("/admin/usuarios");
  return {
    success: "Senha redefinida. Copie a senha temporária agora.",
    temporaryPassword,
  };
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
