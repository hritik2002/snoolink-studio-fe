import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePostLoginPath } from "@/lib/auth/constants";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const nextParam =
    requestUrl.searchParams.get("next") ||
    requestUrl.searchParams.get("redirect");
  const postLoginPath = resolvePostLoginPath({
    next: nextParam,
    redirect: requestUrl.searchParams.get("redirect"),
    view: requestUrl.searchParams.get("view"),
  });

  if (oauthError) {
    const home = new URL("/", requestUrl.origin);
    home.searchParams.set("reason", "auth_error");
    return NextResponse.redirect(home);
  }

  if (!code) {
    return NextResponse.redirect(new URL(postLoginPath, requestUrl.origin));
  }

  const redirectUrl = new URL(postLoginPath, requestUrl.origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth code exchange failed:", error.message);
    const home = new URL("/", requestUrl.origin);
    home.searchParams.set("reason", "auth_error");
    return NextResponse.redirect(home);
  }

  if (data.session) {
    try {
      const token = data.session.access_token;
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      await fetch(`${backendUrl}/api/profile/ensure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (profileError) {
      console.error("Failed to ensure profile after OAuth:", profileError);
    }
  }

  return response;
}
