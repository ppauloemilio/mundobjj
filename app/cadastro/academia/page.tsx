import { AcademyRegisterForm } from "@/components/register-forms";
import { RegisterPageShell } from "@/components/register-page-shell";

export const instant = false;

export default function CadastroAcademiaPage() {
  return (
    <RegisterPageShell
      titleKey="academyAccountTitle"
      subtitleKey="academyAccountSubtitle"
    >
      <AcademyRegisterForm />
    </RegisterPageShell>
  );
}
