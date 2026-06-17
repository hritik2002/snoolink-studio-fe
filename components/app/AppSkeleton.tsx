"use client"

import { cn } from "@/lib/utils"

export function AppSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded bg-gradient-to-r from-app-active via-[#e9eaec] to-app-active",
        "bg-[length:200%_100%] animate-app-shimmer",
        className
      )}
    />
  )
}
