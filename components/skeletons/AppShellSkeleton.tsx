"use client"

import { AppPageLoader } from "@/components/app/AppSpinner"

/** Auth / initial session — spinner only, no fake sidebar blocks */
export function AppShellSkeleton() {
  return (
    <div className="h-svh w-full bg-white flex items-center justify-center">
      <AppPageLoader minHeight="min-h-0" />
    </div>
  )
}
