"use client"

import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProgress,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"

const TOAST_DURATION = 5000

function ToastIcon({ variant }: { variant?: "default" | "destructive" | "success" | null }) {
  const iconClass = "h-[18px] w-[18px] shrink-0"
  const popStyle = { animation: "toast-icon-pop 480ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both" }

  if (variant === "success") {
    return (
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100/80 ring-1 ring-emerald-200/60"
        style={popStyle}
      >
        <CheckCircle2 className={cn(iconClass, "text-emerald-600")} />
      </div>
    )
  }

  if (variant === "destructive") {
    return (
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100/80 ring-1 ring-red-200/60"
        style={popStyle}
      >
        <AlertCircle className={cn(iconClass, "text-red-600")} />
      </div>
    )
  }

  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-orange/10 ring-1 ring-app-orange/20"
      style={popStyle}
    >
      <Sparkles className={cn(iconClass, "text-app-orange")} />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={TOAST_DURATION} swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} duration={TOAST_DURATION} {...props}>
            <ToastIcon variant={variant} />
            <div className="min-w-0 flex-1 grid gap-0.5 pr-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={variant === "success" ? "text-emerald-800/80" : variant === "destructive" ? "text-red-800/80" : undefined}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action && <div className="shrink-0 self-center">{action}</div>}
            <ToastClose />
            <ToastProgress duration={TOAST_DURATION} variant={variant} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
