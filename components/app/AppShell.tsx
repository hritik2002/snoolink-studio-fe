"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appSidebar"
import { TopBar } from "@/components/app/TopBar"
import { PageTransition } from "@/components/app/PageTransition"
import { BottomNav } from "@/components/BottomNav"
import { AppShellSkeleton } from "@/components/skeletons"
import { getViewBreadcrumbs, viewFromPathname } from "@/lib/app-nav"

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeView = viewFromPathname(pathname)
  const breadcrumbs = activeView ? getViewBreadcrumbs(activeView) : [{ label: "Home" }]

  const isCollections = activeView === "collections"

  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden app-root bg-white font-sans">
      <AppSidebar />
      <SidebarInset className="bg-white min-w-0 flex flex-col">
        <TopBar breadcrumbs={breadcrumbs} />
        <div
          id="main"
          className={`flex flex-1 flex-col min-w-0 min-h-0 overflow-x-hidden pb-20 md:pb-0 bg-white ${
            isCollections ? "overflow-y-hidden" : "overflow-y-auto"
          }`}
          tabIndex={-1}
        >
          <PageTransition>{children}</PageTransition>
        </div>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  )
}
