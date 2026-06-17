"use client"

import { Plus, type LucideIcon } from "lucide-react"
import { appBtnPrimary } from "@/lib/app-classes"

interface FirstTimeEmptyStateProps {
  icon: LucideIcon
  resourceName: string
  description?: string
  onCreateFirst: () => void
}

export function FirstTimeEmptyState({
  icon: Icon,
  resourceName,
  description,
  onCreateFirst,
}: FirstTimeEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 px-6 text-center">
      <div className="w-14 h-14 rounded-[10px] bg-app-active flex items-center justify-center">
        <Icon className="w-6 h-6 text-app-4" />
      </div>
      <div className="flex flex-col gap-2 max-w-[360px]">
        <p className="text-[16px] font-semibold text-app-1">
          No {resourceName.toLowerCase()} yet
        </p>
        <p className="text-[14px] text-app-3 leading-relaxed">
          {description ??
            `Create your first ${resourceName.toLowerCase()} to get started.`}
        </p>
      </div>
      <button type="button" onClick={onCreateFirst} className={appBtnPrimary}>
        <Plus className="w-4 h-4" />
        New {resourceName}
      </button>
    </div>
  )
}
