"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { appBtnSecondary } from "@/lib/app-classes"

interface FilterDropdownProps {
  label: string
  value?: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const displayLabel = value
    ? options.find((o) => o.value === value)?.label
    : label

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(appBtnSecondary, "font-normal")}
      >
        {displayLabel}
        <ChevronsUpDown className="w-4 h-4 text-app-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-white border border-app-border-input rounded-app-md shadow-app-dropdown overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={cn(
                "flex items-center w-full px-3 py-2.5 text-[14px] text-app-2 hover:bg-app-hover transition-colors duration-100 text-left",
                value === option.value && "font-medium text-app-1 bg-app-active"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
