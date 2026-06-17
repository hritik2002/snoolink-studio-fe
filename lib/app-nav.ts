export type AppView =
  | "search"
  | "uploads"
  | "collections"
  | "connectors"
  | "profile"
  | "history"
  | "analytics"
  | "settings"
  | "billing"

export const VIEW_LABELS: Record<AppView, string> = {
  search: "Search",
  uploads: "Files",
  collections: "Collections",
  connectors: "Data Connectors",
  profile: "Profile",
  history: "History",
  analytics: "Analytics",
  settings: "Settings",
  billing: "Billing",
}

/** Canonical app routes — use these everywhere instead of ?view= */
export const APP_ROUTES: Record<AppView, string> = {
  search: "/app/search",
  uploads: "/app/uploads",
  collections: "/app/collections",
  connectors: "/app/connectors",
  profile: "/app/profile",
  history: "/app/history",
  analytics: "/app/analytics",
  settings: "/app/settings",
  billing: "/app/billing",
}

export const DEFAULT_APP_PATH = APP_ROUTES.search

export function collectionPath(name: string): string {
  return `/app/collections/${encodeURIComponent(name)}`
}

export function appPath(
  view: AppView,
  query?: Record<string, string | undefined | null>
): string {
  const base = APP_ROUTES[view]
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value != null && value !== "") params.set(key, value)
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export function viewFromPathname(pathname: string): AppView | null {
  const match = pathname.match(/^\/app\/([^/?]+)/)
  if (!match) return null
  const segment = match[1] as AppView
  return segment in APP_ROUTES ? segment : null
}

export function getViewBreadcrumbs(view: AppView) {
  return [
    { label: "Home", href: APP_ROUTES.search },
    { label: VIEW_LABELS[view] },
  ]
}

/** @deprecated Use appPath() */
export function viewHref(view: AppView) {
  return appPath(view)
}

/** Map legacy ?view= param to new path */
export function legacyViewToPath(view: string | null | undefined): string | null {
  if (!view) return null
  if (view in APP_ROUTES) return APP_ROUTES[view as AppView]
  return null
}
