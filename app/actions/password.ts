"use server";

import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";

export type PasswordFormState = {
  error?: string;
  success?: string;
};

const changeSchema = z
  .object({
    currentPassword: z.string().min(6, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha precisa ter ao menos 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação não confere com a nova senha.",
    path: ["confirmPassword"],
  });

export async function changeOwnPasswordAction(
  _prev: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await requireUser();
  const parsed = changeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row?.passwordHash) {
    return { error: "Conta sem senha cadastrada." };
  }

  const valid = await compare(parsed.data.currentPassword, row.passwordHash);
  if (!valid) {
    return { error: "Senha atual incorreta." };
  }

  const passwordHash = await hash(parsed.data.newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  revalidatePath("/painel");
  revalidatePath("/painel/academia");
  revalidatePath("/painel/professor");
  return { success: "Senha atualizada." };
}