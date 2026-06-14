import * as React from "react"

import { cn } from "@/lib/utils"
import { inputBase, inputError } from "@/lib/cg-classes"

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
}

function Input({ className, type, autoFocus = false, error, ...props }: InputProps) {
  return (
    <input
      type={type}
      autoFocus={autoFocus}
      data-slot="input"
      className={cn(
        inputBase,
        "h-10 md:text-body",
        error && inputError,
        className
      )}
      {...props}
    />
  )
}

export { Input }
