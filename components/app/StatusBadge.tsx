import { cn } from "@/lib/utils"

type StatusVariant = "processing" | "done" | "error" | "default"

const VARIANTS: Record<
  StatusVariant,
  { bg: string; text: string; border: string }
> = {
  processing: {
    bg: "bg-[#eff6ff]",
    text: "text-[#3b82f6]",
    border: "border-[#bfdbfe]",
  },
  done: {
    bg: "bg-[#f0fdf4]",
    text: "text-[#16a34a]",
    border: "border-[#bbf7d0]",
  },
  error: {
    bg: "bg-[#fef2f2]",
    text: "text-[#dc2626]",
    border: "border-[#fecaca]",
  },
  default: {
    bg: "bg-app-hover",
    text: "text-app-3",
    border: "border-app-border-input",
  },
}

export function StatusBadge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode
  variant?: StatusVariant
  className?: string
}) {
  const v = VARIANTS[variant]
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[12px] font-medium rounded-app-sm border",
        v.bg,
        v.text,
        v.border,
        className
      )}
    >
      {children}
    </span>
  )
}
