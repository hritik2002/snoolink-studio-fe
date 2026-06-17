export type AppView =
  | "search"
  | "uploads"
  | "collections"
  | "profile"
  | "history"
  | "analytics"
  | "settings"
  | "billing"

export const VIEW_LABELS: Record<AppView, string> = {
  search: "Search",
  uploads: "Uploads",
  collections: "Collections",
  profile: "Profile",
  history: "History",
  analytics: "Analytics",
  settings: "Settings",
  billing: "Billing",
}

export function getViewBreadcrumbs(view: AppView) {
  return [
    { label: "Home", href: "/?view=search" },
    { label: VIEW_LABELS[view] },
  ]
}

export function viewHref(view: AppView) {
  return `/?view=${view}`
}
