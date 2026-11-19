import { AcademyRegisterForm } from "@/components/register-forms";

export const instant = false;

export default function CadastroAcademiaPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Conta de academia
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Conta rápida; complete endereço, professores e grade no painel.
        </p>
      </div>
      <AcademyRegisterForm />
    </main>
  );
}
