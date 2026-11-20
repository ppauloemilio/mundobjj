"use server";

import { hash } from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import {
  academies,
  academyAccessRequests,
  profiles,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { uniqueSlug } from "@/lib/slug";
import {
  randomTemporaryPassword,
  whatsappChatUrl,
} from "@/lib/whatsapp";

export type AccessFormState = {
  error?: string;
  success?: string;
  temporaryPassword?: string;
  whatsappUrl?: string;
};

const requestSchema = z.object({
  academyId: z.string().uuid(),
  name: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("E-mail inválido."),
  whatsapp: z.string().trim().min(8, "Informe um WhatsApp válido."),
  message: z.string().trim().max(500).optional(),
});

export async function requestAcademyAccessAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const parsed = requestSchema.safeParse({
    academyId: formData.get("academyId"),
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    message: formData.get("message") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const [academy] = await db
    .select({
      id: academies.id,
      slug: academies.slug,
      ownerId: academies.ownerId,
    })
    .from(academies)
    .where(eq(academies.id, parsed.data.academyId))
    .limit(1);

  if (!academy) return { error: "Academia não encontrada." };
  if (academy.ownerId) {
    return { error: "Esta academia já tem um responsável com acesso." };
  }

  const email = parsed.data.email.toLowerCase();
  const [existingPending] = await db
    .select({ id: academyAccessRequests.id })
    .from(academyAccessRequests)
    .where(
      and(
        eq(academyAccessRequests.academyId, academy.id),
        eq(academyAccessRequests.email, email),
        eq(academyAccessRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (existingPending) {
    return { error: "Já existe uma solicitação pendente com este e-mail." };
  }

  await db.insert(academyAccessRequests).values({
    academyId: academy.id,
    name: parsed.data.name,
    email,
    whatsapp: parsed.data.whatsapp,
    message: parsed.data.message || null,
    status: "pending",
  });

  revalidatePath(`/academia/${academy.slug}`);
  revalidatePath("/admin/academias");
  revalidatePath("/admin");
  return {
    success:
      "Solicitação enviada. O admin vai analisar e, se aprovar, envia o acesso (login e senha).",
  };
}

async function grantAcademyAccess(input: {
  academyId: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  password: string;
  requestId?: string;
}) {
  const db = requireDb();
  const email = input.email.toLowerCase();

  const [academy] = await db
    .select({
      id: academies.id,
      slug: academies.slug,
      name: academies.name,
      ownerId: academies.ownerId,
      whatsapp: academies.whatsapp,
    })
    .from(academies)
    .where(and(eq(academies.id, input.academyId), isNull(academies.ownerId)))
    .limit(1);

  if (!academy) {
    return { error: "Academia não encontrada ou já tem responsável." as const };
  }

  const [existing] = await db
    .select({ id: users.id, accountType: users.accountType })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = existing?.id;
  const passwordHash = await hash(input.password, 10);

  if (existing) {
    if (existing.accountType !== "academy") {
      return {
        error:
          "Este e-mail já pertence a outra conta (não é academia). Use outro e-mail." as const,
      };
    }
    const [owned] = await db
      .select({ id: academies.id })
      .from(academies)
      .where(eq(academies.ownerId, existing.id))
      .limit(1);
    if (owned) {
      return {
        error: "Este e-mail já é responsável por outra academia." as const,
      };
    }
    await db
      .update(users)
      .set({ passwordHash, name: input.name, blockedAt: null })
      .where(eq(users.id, existing.id));
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      name: input.name,
      email,
      passwordHash,
      accountType: "academy",
      role: "user",
    });
    await db.insert(profiles).values({
      userId,
      name: input.name,
      slug: uniqueSlug(input.name),
      whatsapp: input.whatsapp || null,
    });
  }

  await db
    .update(academies)
    .set({
      ownerId: userId!,
      claimToken: null,
      claimedAt: new Date(),
      ...(input.whatsapp ? { whatsapp: input.whatsapp } : {}),
    })
    .where(eq(academies.id, academy.id));

  if (input.requestId) {
    await db
      .update(academyAccessRequests)
      .set({ status: "approved" })
      .where(eq(academyAccessRequests.id, input.requestId));
  }

  const message = [
    `Olá ${input.name}!`,
    `Seu acesso à academia "${academy.name}" no Mundo BJJ foi liberado.`,
    `E-mail: ${email}`,
    `Senha: ${input.password}`,
    "Entre em https://mundobjj.vercel.app/entrar e altere a senha no painel.",
  ].join("\n");

  const phone = input.whatsapp || academy.whatsapp;
  const whatsappUrl = whatsappChatUrl(phone, message);

  revalidatePath("/admin/academias");
  revalidatePath("/admin");
  revalidatePath(`/academia/${academy.slug}`);
  revalidatePath("/painel/academia");

  return {
    temporaryPassword: input.password,
    whatsappUrl: whatsappUrl ?? undefined,
    success: whatsappUrl
      ? "Acesso criado. Abra o WhatsApp para enviar login e senha."
      : "Acesso criado. Copie a senha e envie ao responsável.",
  } as const;
}

export async function approveAcademyAccessAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  const mode = String(formData.get("mode") || "random");
  const customPassword = String(formData.get("password") || "").trim();

  if (!requestId) return { error: "Solicitação inválida." };

  const db = requireDb();
  const [request] = await db
    .select()
    .from(academyAccessRequests)
    .where(
      and(
        eq(academyAccessRequests.id, requestId),
        eq(academyAccessRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!request) return { error: "Solicitação não encontrada." };

  let password = randomTemporaryPassword();
  if (mode === "manual") {
    if (customPassword.length < 6) {
      return { error: "Informe uma senha com ao menos 6 caracteres." };
    }
    password = customPassword;
  }

  const result = await grantAcademyAccess({
    academyId: request.academyId,
    name: request.name,
    email: request.email,
    whatsapp: request.whatsapp,
    password,
    requestId: request.id,
  });

  if ("error" in result && result.error) return { error: result.error };
  return result;
}

export async function rejectAcademyAccessAction(formData: FormData) {
  await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  if (!requestId) return;

  const db = requireDb();
  await db
    .update(academyAccessRequests)
    .set({ status: "rejected" })
    .where(eq(academyAccessRequests.id, requestId));

  revalidatePath("/admin/academias");
  revalidatePath("/admin");
}

export async function createAcademyOwnerAccessAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  await requireAdmin();
  const parsed = z
    .object({
      academyId: z.string().uuid(),
      name: z.string().trim().min(2),
      email: z.string().trim().email(),
      whatsapp: z.string().trim().optional(),
      password: z.string().trim().optional(),
      mode: z.enum(["manual", "random"]),
    })
    .safeParse({
      academyId: formData.get("academyId"),
      name: formData.get("name"),
      email: formData.get("email"),
      whatsapp: formData.get("whatsapp") || "",
      password: formData.get("password") || "",
      mode: formData.get("mode") || "random",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const password =
    parsed.data.mode === "manual"
      ? parsed.data.password || ""
      : randomTemporaryPassword();

  if (password.length < 6) {
    return { error: "Informe uma senha com ao menos 6 caracteres." };
  }

  const result = await grantAcademyAccess({
    academyId: parsed.data.academyId,
    name: parsed.data.name,
    email: parsed.data.email,
    whatsapp: parsed.data.whatsapp || null,
    password,
  });

  if ("error" in result && result.error) return { error: result.error };
  return result;
}