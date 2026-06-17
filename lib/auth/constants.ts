import { APP_ROUTES, legacyViewToPath, type AppView } from "@/lib/app-nav";

/** Where authenticated users land after OAuth when no ?next= is provided */
export const DEFAULT_POST_LOGIN_PATH = APP_ROUTES.search;

export const APP_VIEW_PARAMS = new Set<string>([
  "search",
  "uploads",
  "collections",
  "connectors",
  "profile",
  "history",
  "analytics",
  "settings",
  "billing",
]);

export function sanitizePostLoginPath(path: string | null | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
  return DEFAULT_POST_LOGIN_PATH;
}

export function isAppViewParam(view: string | null | undefined): boolean {
  return !!view && APP_VIEW_PARAMS.has(view);
}

export function resolvePostLoginPath(options: {
  next?: string | null;
  redirect?: string | null;
  view?: string | null;
}): string {
  const fromNext = options.next || options.redirect;
  if (fromNext) {
    return sanitizePostLoginPath(fromNext);
  }
  const legacy = legacyViewToPath(options.view ?? null);
  if (legacy) return legacy;
  return DEFAULT_POST_LOGIN_PATH;
}

export function buildOAuthCallbackUrl(origin: string, next?: string | null): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set(
    "next",
    sanitizePostLoginPath(next ?? DEFAULT_POST_LOGIN_PATH)
  );
  return url.toString();
}

/** When forwarding ?code= to /auth/callback, ensure ?next= is set. */
export function ensureCallbackNextParam(url: URL): void {
  if (url.searchParams.has("next") || url.searchParams.has("redirect")) {
    return;
  }

  const view = url.searchParams.get("view");
  const legacy = legacyViewToPath(view);
  url.searchParams.set(
    "next",
    legacy ?? resolvePostLoginPath({ view: view as AppView | null })
  );
  url.searchParams.delete("view");
}
