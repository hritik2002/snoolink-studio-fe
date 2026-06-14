import * as React from "react"
import { cn } from "@/lib/utils"
import { badge, badgeSection } from "@/lib/cg-classes"

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "section"
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(variant === "section" ? badgeSection : badge, className)}
      {...props}
    >
      {children}
    </span>
  )
}
