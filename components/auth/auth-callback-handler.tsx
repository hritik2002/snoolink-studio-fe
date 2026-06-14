"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MarketingSkeleton } from "@/components/marketing/marketing-skeleton";
import { DEFAULT_POST_LOGIN_PATH } from "@/lib/auth/constants";

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

    const next =
      searchParams.get("next") ||
      searchParams.get("redirect") ||
      DEFAULT_POST_LOGIN_PATH;
    callback.searchParams.set("next", next);

    window.location.replace(callback.toString());
  }, [searchParams]);

  return <MarketingSkeleton />;
}
