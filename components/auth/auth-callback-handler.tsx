"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AppShellSkeleton } from "@/components/skeletons";
import { resolvePostLoginPath } from "@/lib/auth/constants";

/**
 * Client-side fallback when Supabase redirects to Site URL with ?code=
 * instead of /auth/callback (middleware handles this first when possible).
 */
export function AuthCallbackHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("code", code);

    const next = resolvePostLoginPath({
      next: searchParams.get("next"),
      redirect: searchParams.get("redirect"),
      view: searchParams.get("view"),
    });
    callback.searchParams.set("next", next);

    window.location.replace(callback.toString());
  }, [searchParams]);

  return <AppShellSkeleton />;
}
