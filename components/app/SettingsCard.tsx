import * as React from "react"
import { cn } from "@/lib/utils"
import { appSectionTitle } from "@/lib/app-classes"

interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function SettingsCard({
  title,
  description,
  children,
  footer,
  className,
}: SettingsCardProps) {
  return (
    <div
      className={cn(
        "rounded-app-md border border-app-border overflow-hidden bg-white",
        className
      )}
    >
      <div className="px-5 py-4 border-b border-app-border-light">
        <h2 className={appSectionTitle}>{title}</h2>
        {description && (
          <p className="text-[13px] text-app-3 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-app-border-light bg-app-hover flex justify-end gap-2.5">
          {footer}
        </div>
      )}
    </div>
  )
}
