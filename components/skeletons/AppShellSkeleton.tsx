"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AppShellSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar placeholder */}
      <div className="hidden lg:flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32 flex-1" />
        </div>

        {/* Page content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-12 w-full rounded-[18px]" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-[18px]" />
              <Skeleton className="h-10 w-28 rounded-[18px]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-[18px]" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
