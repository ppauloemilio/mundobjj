import Link from "next/link";
import { QuickAcademyForm } from "@/components/quick-academy-form";

export const instant = false;

export default function IndicarAcademiaPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Indicar academia
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cadastro rápido na busca. A academia pode reivindicar o acesso depois
          com o código gerado.
        </p>
      </div>
      <QuickAcademyForm />
      <p className="text-sm text-[var(--muted)]">
        Já tem o código?{" "}
        <Link href="/reivindicar" className="underline">
          Reivindicar academia
        </Link>
      </p>
    </main>
  );
}