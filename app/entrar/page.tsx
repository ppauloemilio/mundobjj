import { LoginForm } from "@/components/auth-form";

export const instant = false;

export default function EntrarPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Acesse sua conta para editar o perfil ou cadastrar uma academia.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
