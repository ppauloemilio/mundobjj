import Link from "next/link";

export const instant = false;

export default function CadastroPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Escolha o tipo de conta. Cada uma tem um formulário próprio.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/cadastro/atleta"
          className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]"
        >
          <h2 className="text-xl font-semibold">Sou praticante</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Crie seu perfil, informe faixa e vincule sua academia.
          </p>
        </Link>
        <Link
          href="/cadastro/academia"
          className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 transition hover:border-[var(--accent)]"
        >
          <h2 className="text-xl font-semibold">Sou academia</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cadastre a academia, horários e veja quem treina com você.
          </p>
        </Link>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Já tem conta?{" "}
        <Link href="/entrar" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
