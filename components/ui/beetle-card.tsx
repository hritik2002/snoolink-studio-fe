import * as React from "react"
import { cn } from "@/lib/utils"

function BeetleCard({
  className,
  showBrackets = true,
  showAccent = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showBrackets?: boolean
  showAccent?: boolean
}) {
  return (
    <div
      data-slot="beetle-card"
      className={cn("beetle-card p-2", className)}
      {...props}
    >
      {showAccent && <div className="beetle-card-accent" aria-hidden />}
      {showBrackets && (
        <>
          <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
          <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-br" aria-hidden />
        </>
      )}
      {children}
    </div>
  )
}

export { BeetleCard }
