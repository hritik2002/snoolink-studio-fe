import { cn } from "@/lib/utils"

const SIZES = {
  sm: "h-5 w-5 border-[1.5px]",
  md: "h-7 w-7 border-2",
  lg: "h-9 w-9 border-2",
} as const

interface AppSpinnerProps {
  size?: keyof typeof SIZES
  className?: string
  label?: string
}

/** Neutral ring spinner — no layout shift, no orange accent */
export function AppSpinner({
  size = "md",
  className,
  label = "Loading",
}: AppSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "rounded-full border-app-border-light border-t-app-3 animate-spin motion-reduce:animate-none",
        SIZES[size],
        className
      )}
    />
  )
}

interface AppPageLoaderProps {
  className?: string
  label?: string
  minHeight?: string
}

/** Centered loader for page content areas — fixed min-height prevents CLS */
export function AppPageLoader({
  className,
  label,
  minHeight = "min-h-[min(60vh,480px)]",
}: AppPageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center w-full",
        minHeight,
        className
      )}
    >
      <AppSpinner size="lg" />
      {label ? (
        <p className="mt-3 text-[13px] text-app-3">{label}</p>
      ) : null}
    </div>
  )
}
