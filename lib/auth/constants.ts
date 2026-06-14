/** Where authenticated users land after OAuth when no ?next= is provided */
export const DEFAULT_POST_LOGIN_PATH = "/?view=search";

export function sanitizePostLoginPath(path: string | null | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }
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
