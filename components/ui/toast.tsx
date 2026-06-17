"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-3 p-4 sm:max-w-[420px] pointer-events-none",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10",
    "backdrop-blur-xl backdrop-saturate-150",
    "shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.6)]",
    "transition-[box-shadow,transform] duration-300",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-toast-enter data-[state=closed]:animate-toast-exit",
    "data-[swipe=end]:animate-toast-exit",
    "hover:shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-app-border/80 bg-white/90 text-app-1",
        destructive:
          "destructive border-red-200/80 bg-red-50/95 text-red-900",
        success:
          "border-emerald-200/80 bg-emerald-50/95 text-emerald-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg px-3 text-xs font-semibold",
      "border border-app-border/60 bg-white/80 text-app-2",
      "shadow-sm transition-all duration-200",
      "hover:border-app-orange/40 hover:bg-app-orange/5 hover:text-app-orange hover:shadow-md hover:-translate-y-px",
      "focus:outline-none focus:ring-2 focus:ring-app-orange/30 focus:ring-offset-1",
      "group-[.destructive]:border-red-200 group-[.destructive]:bg-white/80 group-[.destructive]:text-red-700",
      "group-[.destructive]:hover:border-red-300 group-[.destructive]:hover:bg-red-100",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2.5 top-2.5 rounded-md p-1 text-app-4",
      "opacity-0 transition-all duration-200",
      "hover:bg-black/5 hover:text-app-2",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-app-orange/30",
      "group-hover:opacity-100",
      "group-[.destructive]:text-red-400 group-[.destructive]:hover:bg-red-100 group-[.destructive]:hover:text-red-700",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-snug tracking-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm leading-relaxed text-app-3 mt-0.5", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const ToastProgress = ({
  duration = 5000,
  variant = "default",
  className,
}: {
  duration?: number
  variant?: "default" | "destructive" | "success" | null
  className?: string
}) => (
  <div
    className={cn(
      "absolute bottom-0 left-0 right-0 h-[3px] origin-left overflow-hidden rounded-b-xl",
      className
    )}
  >
    <div
      className={cn(
        "h-full w-full origin-left rounded-b-xl",
        variant === "success" && "bg-emerald-400/70",
        variant === "destructive" && "bg-red-400/70",
        (!variant || variant === "default") && "bg-app-orange/50"
      )}
      style={{
        animation: `toast-progress ${duration}ms linear forwards`,
      }}
    />
  </div>
)

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastProgress,
}
