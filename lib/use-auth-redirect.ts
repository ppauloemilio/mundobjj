"use client";

import { useEffect } from "react";

/** Hard navigate after Auth.js sets the session cookie (soft nav often fails). */
export function useAuthRedirect(redirectTo?: string) {
  useEffect(() => {
    if (!redirectTo) return;
    window.location.assign(redirectTo);
  }, [redirectTo]);
}
