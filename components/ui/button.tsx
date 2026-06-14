import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[18px] text-base font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-btn-dark)] hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border border-border bg-background shadow-[var(--shadow-btn-light)] hover:-translate-y-0.5 active:translate-y-0 hover:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline hover:text-[var(--color-accent-orange)]",
        /* Cloudglue light button */
        glue:
          "bg-background text-foreground border border-[var(--color-border-warm)] shadow-[var(--shadow-btn-light)] hover:-translate-y-0.5 active:translate-y-0",
        /* Cloudglue dark button */
        "glue-dark":
          "bg-primary text-primary-foreground shadow-[var(--shadow-btn-dark)] hover:-translate-y-0.5 active:translate-y-0 h-12 px-8",
        /* Legacy aliases */
        beetle:
          "bg-primary text-primary-foreground shadow-[var(--shadow-btn-dark)] hover:-translate-y-0.5 active:translate-y-0 h-12 px-8",
        "beetle-secondary":
          "bg-background text-foreground border border-[var(--color-border-warm)] shadow-[var(--shadow-btn-light)] hover:-translate-y-0.5 h-9 px-4 text-sm",
        "beetle-tertiary":
          "bg-primary text-primary-foreground shadow-[var(--shadow-btn-dark)] hover:-translate-y-0.5 h-12 px-8",
        "beetle-green":
          "bg-secondary text-foreground border border-border hover:bg-muted h-9 px-4 text-sm",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4 text-[15px]",
        sm: "h-9 rounded-[13px] gap-1.5 px-4 has-[>svg]:px-3 text-sm",
        lg: "h-12 rounded-[18px] px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-[18px]",
        "icon-sm": "size-9 rounded-[13px]",
        "icon-lg": "size-12 rounded-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
