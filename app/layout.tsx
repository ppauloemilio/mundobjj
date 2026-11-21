import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeScript } from "@/components/theme-script";
import { defaultLocale, localeTag } from "@/lib/i18n/config";
import { getRequestLocale } from "@/lib/i18n/locale";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mundo BJJ",
  description:
    "Find Brazilian Jiu-Jitsu gyms by city or near you. See coaches, schedules, and visitor-friendly academies.",
};

function Shell({
  locale,
  children,
}: {
  locale: typeof defaultLocale;
  children: ReactNode;
}) {
  return (
    <LocaleProvider locale={locale}>
      <Suspense
        fallback={
          <div className="app-shell-main">
            <div className="site-header h-14" />
            {children}
          </div>
        }
      >
        <AppShell>{children}</AppShell>
      </Suspense>
    </LocaleProvider>
  );
}

async function LocaleShell({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();
  return <Shell locale={locale}>{children}</Shell>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={localeTag(defaultLocale)}
      className={`${manrope.variable} ${sora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <Suspense fallback={<Shell locale={defaultLocale}>{children}</Shell>}>
          <LocaleShell>{children}</LocaleShell>
        </Suspense>
      </body>
    </html>
  );
}
