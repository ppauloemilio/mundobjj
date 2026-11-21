import Link from "next/link";
import { SettingsClient } from "@/components/settings-client";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { requireAppUser } from "@/lib/session";

export const instant = false;

export default async function ConfiguracoesPage() {
  await requireAppUser();
  const locale = await getRequestLocale();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <Link
          href="/painel"
          className="text-[13px] text-[var(--mute)] underline"
        >
          ← {t(locale, "myProfileTitle")}
        </Link>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">
          {t(locale, "settingsLink")}
        </h1>
      </div>
      <SettingsClient />
    </section>
  );
}
