"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type ThemeMode = "system" | "light" | "dark";

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem("mbjj_theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return "system";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
    try {
      localStorage.removeItem("mbjj_theme");
    } catch {
      /* ignore */
    }
    return;
  }
  root.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("mbjj_theme", mode);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const { t } = useLocale();
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    setMode(readTheme());
  }, []);

  function cycle() {
    const next: ThemeMode =
      mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    applyTheme(next);
  }

  const label =
    mode === "light"
      ? t("themeLight")
      : mode === "dark"
        ? t("themeDark")
        : t("themeSystem");

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--line)] px-3 text-[12px] font-semibold text-[var(--ink)]"
      aria-label={`${t("themeLabel")}: ${label}`}
    >
      {label}
    </button>
  );
}
