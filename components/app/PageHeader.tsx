"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { appBtnPrimary, appPageTitle } from "@/lib/app-classes"

interface PageHeaderProps {
  title: string
  description?: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryActions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryActions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("px-6 pt-6 pb-4 flex flex-col gap-5", className)}>
      <div className="flex flex-col gap-1">
        <h1 className={appPageTitle}>{title}</h1>
        {description && (
          <p className="text-[14px] text-app-3">{description}</p>
        )}
      </div>
      {(primaryAction || secondaryActions) && (
        <div className="flex items-center justify-between gap-3">
          {primaryAction ? (
            <button type="button" onClick={primaryAction.onClick} className={appBtnPrimary}>
              {primaryAction.icon ?? <Plus className="w-4 h-4" />}
              {primaryAction.label}
            </button>
          ) : (
            <div />
          )}
          {secondaryActions && (
            <div className="flex items-center gap-2">{secondaryActions}</div>
          )}
        </div>
      )}
    </div>
  )
}
