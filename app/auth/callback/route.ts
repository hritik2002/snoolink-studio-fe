import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // After successful OAuth, ensure user profile is created/updated
    if (data.session && !error) {
      try {
        const token = data.session.access_token;
        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

        // Call backend to ensure profile exists with user data from OAuth
        // This extracts name and email from Google OAuth and stores in profiles table
        await fetch(`${backendUrl}/api/profile/ensure`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Silently fail - profile will be created on first access
        console.error("Failed to ensure profile after OAuth:", error);
      }
    }
  }

  // Redirect to ?next= when provided (e.g. /upload, /?view=collections) so deep links work
  const next = requestUrl.searchParams.get("next") || requestUrl.searchParams.get("redirect");
  const dest = next && next.startsWith("/") ? `${origin}${next}` : `${origin}/`;
  return NextResponse.redirect(dest);
}

