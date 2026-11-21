"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={() => {
        startTransition(async () => {
          await logoutAction();
          window.location.assign("/");
        });
      }}
    >
      {children}
    </button>
  );
}
