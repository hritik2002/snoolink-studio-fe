import * as React from "react"
import { cn } from "@/lib/utils"

function GlueCard({
  className,
  showAccent = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showAccent?: boolean
}) {
  return (
    <div
      data-slot="glue-card"
      className={cn("glue-card", className)}
      {...props}
    >
      {showAccent && <div className="glue-card-accent" aria-hidden />}
      {children}
    </div>
  )
}

/** @deprecated Use GlueCard — kept for backward compatibility */
const BeetleCard = GlueCard

export { GlueCard, BeetleCard }
