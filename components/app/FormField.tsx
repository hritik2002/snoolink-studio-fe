import * as React from "react"
import { cn } from "@/lib/utils"
import { appInput, appLabel } from "@/lib/app-classes"

interface FormFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function FormField({ label, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className={appLabel}>{label}</label>
      {children}
    </div>
  )
}

export function AppInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return <input className={cn(appInput, className)} {...props} />
}

export function AppTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(appInput, "resize-none", className)}
      {...props}
    />
  )
}
