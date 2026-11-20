import { ProfessorRegisterForm } from "@/components/register-forms";
import { RegisterPageShell } from "@/components/register-page-shell";

export const instant = false;

export default function CadastroProfessorPage() {
  return (
    <RegisterPageShell
      titleKey="professorAccountTitle"
      subtitleKey="professorAccountSubtitle"
    >
      <ProfessorRegisterForm />
    </RegisterPageShell>
  );
}
