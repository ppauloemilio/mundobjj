import { Suspense, type ReactNode } from "react";
import { requireAppUser } from "@/lib/session";

export const instant = false;

function PainelChrome({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {children}
    </main>
  );
}

async function PainelGate({ children }: { children: ReactNode }) {
  await requireAppUser();
  return <PainelChrome>{children}</PainelChrome>;
}

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <PainelChrome>
          <div className="ui-card h-40 animate-pulse bg-[var(--card)]" />
        </PainelChrome>
      }
    >
      <PainelGate>{children}</PainelGate>
    </Suspense>
  );
}
