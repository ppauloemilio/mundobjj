import type { ReactNode } from "react";
import { requireAppUser } from "@/lib/session";

export const instant = false;

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {children}
    </main>
  );
}
