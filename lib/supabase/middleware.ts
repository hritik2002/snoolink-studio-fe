import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ensureCallbackNextParam,
  isAppViewParam,
} from "@/lib/auth/constants";
import { legacyViewToPath } from "@/lib/app-nav";

const PROTECTED_PREFIXES = ["/admin", "/app"];

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const code = request.nextUrl.searchParams.get("code");
  if (code && pathname !== "/auth/callback") {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    ensureCallbackNextParam(callback);
    return NextResponse.redirect(callback);
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError && pathname !== "/auth/callback") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    home.searchParams.set("reason", "auth_error");
    return NextResponse.redirect(home);
  }

  // Legacy ?view= deep links → /app/:view
  const legacyView = request.nextUrl.searchParams.get("view");
  if (pathname === "/" && isAppViewParam(legacyView)) {
    const target = request.nextUrl.clone();
    target.pathname = legacyViewToPath(legacyView)!;
    target.searchParams.delete("view");
    return NextResponse.redirect(target);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/login")) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    const next = request.nextUrl.searchParams.get("next");
    const reason = request.nextUrl.searchParams.get("reason");
    if (next) home.searchParams.set("next", next);
    if (reason) home.searchParams.set("reason", reason);
    return NextResponse.redirect(home);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    const next = pathname + search;
    if (next && next !== "/") {
      home.searchParams.set("next", next);
    }
    return NextResponse.redirect(home);
  }

  // Signed-in users on marketing home → app dashboard
  if (user && pathname === "/" && !legacyView && !code && !oauthError) {
    const app = request.nextUrl.clone();
    app.pathname = "/app/search";
    app.search = "";
    return NextResponse.redirect(app);
  }

  return supabaseResponse;
}
