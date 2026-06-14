import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { btnDark, btnGhost, btnLight, btnSm } from "@/lib/cg-classes"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: btnDark,
        light: btnLight,
        dark: btnDark,
        destructive:
          "inline-flex items-center justify-center gap-2 rounded-btn px-7 py-[13px] font-ui text-body font-medium bg-destructive text-white hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/20 disabled:opacity-40 disabled:pointer-events-none",
        outline: btnLight,
        secondary:
          "inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2 font-body text-sm font-medium bg-cg-bg-alt text-cg-ink border border-cg-line hover:bg-cg-bg-warm transition-colors duration-200 ease-cg disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20",
        ghost: btnGhost,
        link:
          "inline-flex items-center gap-2 font-body text-body text-cg-ink underline-offset-4 hover:underline hover:text-cg-orange transition-colors duration-200 ease-cg",
        /* Legacy aliases */
        glue: btnDark,
        "glue-dark": btnDark,
        beetle: btnDark,
        "beetle-secondary": cn(btnLight, btnSm),
        "beetle-tertiary": btnDark,
        "beetle-green":
          "inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2 font-body text-sm font-medium bg-cg-bg-alt text-cg-ink border border-cg-line hover:bg-cg-bg-warm transition-colors duration-200 ease-cg disabled:opacity-40 disabled:pointer-events-none",
      },
      size: {
        default: "",
        sm: btnSm,
        lg: "rounded-btn px-8 py-3.5 text-body",
        icon: "size-10 rounded-btn p-0",
        "icon-sm": "size-9 rounded-badge p-0",
        "icon-lg": "size-12 rounded-btn p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </Comp>
  )
}

export { Button, buttonVariants }
