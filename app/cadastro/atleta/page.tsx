import { AthleteRegisterForm } from "@/components/register-forms";
import { RegisterPageShell } from "@/components/register-page-shell";

export const instant = false;

export default function CadastroAtletaPage() {
  return (
    <RegisterPageShell
      titleKey="athleteAccountTitle"
      subtitleKey="athleteAccountSubtitle"
    >
      <AthleteRegisterForm />
    </RegisterPageShell>
  );
}
