"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { appBtnSecondary } from "@/lib/app-classes"

export interface AppRowMenuItem {
  label: string
  onClick: (e: React.MouseEvent) => void
  variant?: "default" | "danger"
  disabled?: boolean
  icon?: React.ReactNode
}

interface AppRowMenuProps {
  items: AppRowMenuItem[]
  ariaLabel?: string
  menuWidth?: number
}

export function AppRowMenu({
  items,
  ariaLabel = "More actions",
  menuWidth = 128,
}: AppRowMenuProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const menuHeight = items.length * 40 + 8
    const gap = 4

    let top = rect.bottom + gap
    if (top + menuHeight > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - menuHeight - gap)
    }

    const left = Math.min(
      Math.max(gap, rect.right - menuWidth),
      window.innerWidth - menuWidth - gap
    )

    setPosition({ top, left })
  }, [items.length, menuWidth])

  useEffect(() => {
    if (!open) return

    updatePosition()

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    const onReposition = () => updatePosition()

    document.addEventListener("mousedown", onPointerDown)
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className={cn(appBtnSecondary, "h-8 w-8 p-0 justify-center")}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[300] bg-white border border-app-border-input rounded-app-md shadow-app-dropdown overflow-hidden"
            style={{ top: position.top, left: position.left, width: menuWidth }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-left disabled:opacity-50",
                  item.variant === "danger"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-app-2 hover:bg-app-hover"
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick(e)
                  if (!item.disabled) setOpen(false)
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
