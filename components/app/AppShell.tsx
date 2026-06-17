"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appSidebar"
import { TopBar } from "@/components/app/TopBar"
import { BottomNav } from "@/components/BottomNav"
import { getViewBreadcrumbs, viewFromPathname } from "@/lib/app-nav"
import { memo } from "react"

/** Sidebar + bottom nav — never depends on route content */
const AppChrome = memo(function AppChrome({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden app-root bg-white font-sans">
      <AppSidebar />
      <SidebarInset className="bg-white min-w-0 flex flex-col">{children}</SidebarInset>
      <BottomNav />
    </SidebarProvider>
  )
})

function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeView = viewFromPathname(pathname)
  const breadcrumbs = activeView ? getViewBreadcrumbs(activeView) : [{ label: "Home" }]
  const isCollections = activeView === "collections"

  return (
    <>
      <TopBar breadcrumbs={breadcrumbs} />
      <div
        id="main"
        className={`flex flex-1 flex-col min-w-0 min-h-0 overflow-x-hidden pb-20 md:pb-0 bg-white ${
          isCollections ? "overflow-y-hidden" : "overflow-y-auto"
        }`}
        tabIndex={-1}
      >
        <div className="flex flex-1 flex-col min-h-0 min-w-0">{children}</div>
      </div>
    </>
  )
}

/**
 * Persistent app shell — sidebar stays mounted; only main column updates on navigation.
 * No page fade animations. Content loaders use a fixed-height spinner (CLS ≈ 0).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppChrome>
      <AppMain>{children}</AppMain>
    </AppChrome>
  )
}
