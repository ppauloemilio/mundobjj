import { ProfessorRegisterForm } from "@/components/register-forms";

export const instant = false;

export default function CadastroProfessorPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Conta de professor</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Crie seu perfil e vincule-se às academias onde você ensina BJJ.
        </p>
      </div>
      <ProfessorRegisterForm />
    </main>
  );
}