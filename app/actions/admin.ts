"use server";

import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import {
  academies,
  businessCategories,
  businesses,
  profiles,
  users,
} from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import {
  composeStreetAddress,
  readAddressFromForm,
  readLocationFromForm,
  resolveLocationToCityId,
} from "@/lib/location-input";
import {
  moderationPatch,
  type ModerationStatus,
} from "@/lib/moderation";
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
import { getWorldCountryName, getWorldStateName } from "@/lib/world-geo";

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
    .set(
      block
        ? moderationPatch("blocked")
        : moderationPatch("active"),
    )
    .where(eq(users.id, userId));

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
}

export async function setUserModerationAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const status = String(formData.get("status") || "") as ModerationStatus;
  if (!userId || !["active", "suspended", "blocked"].includes(status)) return;
  if (userId === admin.id) return;

  const db = requireDb();
  await db.update(users).set(moderationPatch(status)).where(eq(users.id, userId));
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
      affiliation: z.string().trim().optional(),
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp") || "",
      affiliation: formData.get("affiliation") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const address = readAddressFromForm(formData);
  if (!address.street || address.street.length < 2) {
    return { error: "Informe a rua / logradouro." };
  }
  if (!address.streetNumber) {
    return { error: "Informe o número." };
  }

  const professorInput = readProfessorFromForm(formData);
  if (
    professorInput.professorMode === "other" &&
    professorInput.suggestedProfessorName.length < 2
  ) {
    return { error: "Informe o nome do professor ou escolha na lista." };
  }

  const location = readLocationFromForm(formData);
  const cityId = await resolveLocationToCityId(location, admin.id);
  if (!cityId && !location.customCity) {
    return { error: "Selecione a cidade ou use Outro." };
  }

  const db = requireDb();
  const composedAddress = composeStreetAddress(address);
  const placeName = [
    location.cityName || location.customCity,
    location.stateCode
      ? getWorldStateName(location.countryIso2 || "BR", location.stateCode)
      : location.customState,
    location.countryIso2
      ? getWorldCountryName(location.countryIso2)
      : location.customCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const coords = await geocodeAddress(
    [composedAddress, address.neighborhood, placeName].filter(Boolean).join(", "),
  );

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
      address: composedAddress,
      postalCode: address.postalCode || null,
      street: address.street || null,
      streetNumber: address.streetNumber || null,
      complement: address.complement || null,
      neighborhood: address.neighborhood || null,
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
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      academyId: formData.get("academyId"),
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const address = readAddressFromForm(formData);
  const location = readLocationFromForm(formData);
  const hasAddressUpdate = Boolean(address.street || location.countryIso2);

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

  let addressPatch: Record<string, string | null> = {};
  if (hasAddressUpdate) {
    if (!address.street || !address.streetNumber) {
      return { error: "Informe rua e número do endereço." };
    }
    const cityId = await resolveLocationToCityId(location, admin.id);
    const composedAddress = composeStreetAddress(address);
    const placeName = [
      location.cityName || location.customCity,
      location.stateCode
        ? getWorldStateName(location.countryIso2 || "BR", location.stateCode)
        : location.customState,
      location.countryIso2
        ? getWorldCountryName(location.countryIso2)
        : location.customCountry,
    ]
      .filter(Boolean)
      .join(", ");
    const coords = await geocodeAddress(
      [composedAddress, address.neighborhood, placeName]
        .filter(Boolean)
        .join(", "),
    );
    addressPatch = {
      address: composedAddress,
      postalCode: address.postalCode || null,
      street: address.street || null,
      streetNumber: address.streetNumber || null,
      complement: address.complement || null,
      neighborhood: address.neighborhood || null,
      ...(cityId ? { cityId } : {}),
      lat: coords ? String(coords.lat) : null,
      lng: coords ? String(coords.lng) : null,
    };
  }

  await db
    .update(academies)
    .set({
      name: parsed.data.name,
      ...(touchedProfessor ? { professorName: professorName ?? null } : {}),
      whatsapp: parsed.data.whatsapp || null,
      ...addressPatch,
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
    .set(block ? moderationPatch("blocked") : moderationPatch("active"))
    .where(eq(academies.id, academyId));

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
  revalidatePath("/");
}

export async function setAcademyModerationAction(formData: FormData) {
  await requireAdmin();
  const academyId = String(formData.get("academyId") || "");
  const status = String(formData.get("status") || "") as ModerationStatus;
  if (!academyId || !["active", "suspended", "blocked"].includes(status)) return;

  const db = requireDb();
  await db
    .update(academies)
    .set(moderationPatch(status))
    .where(eq(academies.id, academyId));

  revalidatePath("/admin");
  revalidatePath("/admin/academias");
  revalidatePath("/");
}

export async function updateBusinessAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      businessId: z.string().uuid(),
      name: z.string().trim().min(2),
      categoryId: z.string().uuid(),
      whatsapp: z.string().trim().optional(),
      link: z.string().trim().optional(),
      address: z.string().trim().optional(),
      sponsored: z.coerce.boolean().optional(),
    })
    .safeParse({
      businessId: formData.get("businessId"),
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      whatsapp: formData.get("whatsapp") || "",
      link: formData.get("link") || "",
      address: formData.get("address") || "",
      sponsored: formData.get("sponsored") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const location = readLocationFromForm(formData);
  const cityId = await resolveLocationToCityId(location, admin.id);
  const db = requireDb();
  await db
    .update(businesses)
    .set({
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      whatsapp: parsed.data.whatsapp || null,
      link: parsed.data.link || null,
      address: parsed.data.address || null,
      sponsored: Boolean(parsed.data.sponsored),
      ...(cityId ? { cityId } : {}),
    })
    .where(eq(businesses.id, parsed.data.businessId));

  revalidatePath("/admin/lojas");
  revalidatePath("/");
  return { success: "Loja atualizada." };
}

export async function createBusinessAdminAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      categoryId: z.string().uuid(),
      whatsapp: z.string().trim().optional(),
      link: z.string().trim().optional(),
      address: z.string().trim().optional(),
      sponsored: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      categoryId: formData.get("categoryId"),
      whatsapp: formData.get("whatsapp") || "",
      link: formData.get("link") || "",
      address: formData.get("address") || "",
      sponsored: formData.get("sponsored") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const [category] = await db
    .select({ id: businessCategories.id })
    .from(businessCategories)
    .where(eq(businessCategories.id, parsed.data.categoryId))
    .limit(1);
  if (!category) return { error: "Categoria inválida." };

  const location = readLocationFromForm(formData);
  const cityId = await resolveLocationToCityId(location, admin.id);

  await db.insert(businesses).values({
    slug: uniqueSlug(parsed.data.name),
    name: parsed.data.name,
    categoryId: parsed.data.categoryId,
    whatsapp: parsed.data.whatsapp || null,
    link: parsed.data.link || null,
    address: parsed.data.address || null,
    sponsored: parsed.data.sponsored !== false,
    ...(cityId ? { cityId } : {}),
  });

  revalidatePath("/admin/lojas");
  revalidatePath("/");
  return { success: "Loja cadastrada." };
}

export async function setBusinessModerationAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") || "");
  const status = String(formData.get("status") || "") as ModerationStatus;
  if (!businessId || !["active", "suspended", "blocked"].includes(status)) return;

  const db = requireDb();
  await db
    .update(businesses)
    .set(moderationPatch(status))
    .where(eq(businesses.id, businessId));

  revalidatePath("/admin");
  revalidatePath("/admin/lojas");
  revalidatePath("/");
}
