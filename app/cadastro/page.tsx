import { RegisterForm } from "@/components/auth-form";

export const instant = false;

export default function CadastroPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Criar conta</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cadastre-se para publicar seu perfil de praticante e, se quiser, a
          academia.
        </p>
      </div>
      <RegisterForm />
    </main>
  );
}
