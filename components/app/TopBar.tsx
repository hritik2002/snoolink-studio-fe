"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, PanelLeft } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface TopBarProps {
  breadcrumbs: BreadcrumbItem[]
  className?: string
}

export function TopBar({ breadcrumbs, className }: TopBarProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <div
      className={cn(
        "flex items-center gap-2 h-[53px] px-6 border-b border-app-border bg-white shrink-0",
        className
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-1 rounded-app-sm hover:bg-app-hover transition-colors duration-150 mr-1 md:hidden"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="w-4 h-4 text-app-3" />
      </button>

      <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={`${crumb.label}-${idx}`}>
            {idx > 0 && (
              <ChevronRight className="w-3 h-3 text-app-4 shrink-0" aria-hidden />
            )}
            {crumb.href && idx < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="text-[13px] text-app-3 hover:text-app-2 transition-colors duration-150 no-underline"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[13px] text-app-2">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  )
}
