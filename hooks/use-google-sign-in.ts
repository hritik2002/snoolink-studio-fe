"use client";

import { createClient } from "@/lib/supabase/client";
import { buildOAuthCallbackUrl } from "@/lib/auth/constants";
import { useCallback, useState } from "react";

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const signIn = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(window.location.search);
      const next =
        params.get("next") || params.get("redirect") || undefined;

      const redirectTo = buildOAuthCallbackUrl(window.location.origin, next);

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (authError) throw authError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }, [supabase]);

  return { signIn, loading, error };
}
