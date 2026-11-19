"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import {
  academies,
  academyProfessors,
  profiles,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";

export type LinkProfessorState = { error?: string; success?: string };

const slugSchema = z.string().trim().min(2);

async function professorProfileBySlug(slug: string) {
  const db = requireDb();
  const normalized = slugify(slug);
  if (!normalized) return null;
  const [row] = await db
    .select({
      profileId: profiles.id,
      userId: profiles.userId,
      name: profiles.name,
      accountType: users.accountType,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.slug, normalized))
    .limit(1);

  if (!row || row.accountType !== "professor") return null;
  return row;
}

export async function linkProfessorBySlugAction(
  _prev: LinkProfessorState,
  formData: FormData,
): Promise<LinkProfessorState> {
  const user = await requireUser();
  const academyId = String(formData.get("academyId") || "");
  const parsed = slugSchema.safeParse(formData.get("professorSlug"));
  if (!parsed.success) return { error: "Informe o link do professor." };

  const db = requireDb();
  const [owned] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(and(eq(academies.id, academyId), eq(academies.ownerId, user.id)))
    .limit(1);
  if (!owned) return { error: "Academia não encontrada." };

  const professor = await professorProfileBySlug(parsed.data);
  if (!professor) {
    return { error: "Professor não encontrado. Use o link do perfil (ex.: joao-silva)." };
  }

  const [existing] = await db
    .select({ id: academyProfessors.id, status: academyProfessors.status })
    .from(academyProfessors)
    .where(
      and(
        eq(academyProfessors.academyId, academyId),
        eq(academyProfessors.professorProfileId, professor.profileId),
      ),
    )
    .limit(1);

  if (existing?.status === "active") {
    return { error: "Este professor já está vinculado." };
  }

  if (existing) {
    await db
      .update(academyProfessors)
      .set({ status: "active" })
      .where(eq(academyProfessors.id, existing.id));
  } else {
    await db.insert(academyProfessors).values({
      academyId,
      professorProfileId: professor.profileId,
      status: "active",
    });
  }

  revalidatePath("/painel/academia");
  return { success: `${professor.name} vinculado à academia.` };
}

export async function requestAcademyLinkAction(
  _prev: LinkProfessorState,
  formData: FormData,
): Promise<LinkProfessorState> {
  const user = await requireUser();
  if (user.accountType !== "professor") {
    return { error: "Apenas contas de professor podem solicitar vínculo." };
  }

  const parsed = slugSchema.safeParse(formData.get("academySlug"));
  if (!parsed.success) return { error: "Informe o link da academia." };

  const db = requireDb();
  const slug = parsed.data.trim().toLowerCase();
  const [academy] = await db
    .select({ id: academies.id, name: academies.name })
    .from(academies)
    .where(eq(academies.slug, slug))
    .limit(1);
  if (!academy) return { error: "Academia não encontrada." };

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);
  if (!profile) return { error: "Perfil não encontrado." };

  const [existing] = await db
    .select({ id: academyProfessors.id, status: academyProfessors.status })
    .from(academyProfessors)
    .where(
      and(
        eq(academyProfessors.academyId, academy.id),
        eq(academyProfessors.professorProfileId, profile.id),
      ),
    )
    .limit(1);

  if (existing?.status === "active") {
    return { error: "Você já está vinculado a esta academia." };
  }
  if (existing?.status === "pending") {
    return { error: "Solicitação já enviada. Aguarde a academia." };
  }

  await db.insert(academyProfessors).values({
    academyId: academy.id,
    professorProfileId: profile.id,
    status: "pending",
  });

  revalidatePath("/painel/professor");
  return { success: `Solicitação enviada para ${academy.name}.` };
}

export async function respondProfessorLinkAction(
  _prev: LinkProfessorState,
  formData: FormData,
): Promise<LinkProfessorState> {
  const user = await requireUser();
  const linkId = String(formData.get("linkId") || "");
  const decision = String(formData.get("decision") || "");
  if (!linkId || (decision !== "approve" && decision !== "reject")) {
    return { error: "Ação inválida." };
  }

  const db = requireDb();
  const [link] = await db
    .select({
      id: academyProfessors.id,
      academyId: academyProfessors.academyId,
      status: academyProfessors.status,
    })
    .from(academyProfessors)
    .where(eq(academyProfessors.id, linkId))
    .limit(1);
  if (!link || link.status !== "pending") {
    return { error: "Solicitação não encontrada." };
  }

  const [owned] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(and(eq(academies.id, link.academyId), eq(academies.ownerId, user.id)))
    .limit(1);
  if (!owned) return { error: "Sem permissão." };

  if (decision === "reject") {
    await db.delete(academyProfessors).where(eq(academyProfessors.id, linkId));
    revalidatePath("/painel/academia");
    return { success: "Solicitação recusada." };
  }

  await db
    .update(academyProfessors)
    .set({ status: "active" })
    .where(eq(academyProfessors.id, linkId));

  revalidatePath("/painel/academia");
  return { success: "Professor aprovado." };
}