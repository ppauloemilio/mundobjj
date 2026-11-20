import Link from "next/link";
import { ClaimAcademyForm } from "@/components/claim-academy-form";

export const instant = false;

export default async function ReivindicarPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Reivindicar academia
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Use o código gerado no cadastro rápido para criar a conta e assumir a
          ficha.
        </p>
      </div>
      <ClaimAcademyForm initialToken={params.codigo ?? ""} />
      <p className="text-sm text-[var(--muted)]">
        Ainda não está na busca?{" "}
        <Link href="/indicar-academia" className="underline">
          Indicar academia
        </Link>
      </p>
    </main>
  );
}