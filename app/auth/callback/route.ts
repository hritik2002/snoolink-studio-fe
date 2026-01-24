import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

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
  // Default to "/" to ensure users are redirected to home after successful authentication
  const next = requestUrl.searchParams.get("next") || requestUrl.searchParams.get("redirect");
  const dest = next && next.startsWith("/") ? `${origin}${next}` : `${origin}/`;
  
  // Create redirect response - cookies set via setAll callback will be included
  return NextResponse.redirect(dest);
}

