"use client"

import { cn } from "@/lib/utils"

interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer select-none w-fit",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex items-center w-10 h-[22px] rounded-[11px]",
          "transition-colors duration-150 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          checked
            ? "bg-app-orange focus-visible:ring-app-orange/40"
            : "bg-[#d1d5db] focus-visible:ring-app-4/40"
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white",
            "shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
            "transition-transform duration-150 ease-in-out",
            checked ? "translate-x-[20px]" : "translate-x-[2px]"
          )}
        />
      </button>
      {label && (
        <span className="text-[14px] text-app-2 leading-none">{label}</span>
      )}
    </label>
  )
}
