"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      className={cn(
        "flex-1 flex flex-col min-h-0 min-w-0 animate-app-fade-in",
        className
      )}
    >
      {children}
    </div>
  )
}
