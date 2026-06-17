"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { appBtnPrimary, appBtnSecondary } from "@/lib/app-classes"

interface ModalShellProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
  className?: string
}

export function ModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  width = "740px",
  className,
}: ModalShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-app-fade-in data-[state=closed]:animate-app-fade-out" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] -translate-x-1/2 -translate-y-1/2",
            "bg-white rounded-[16px] border border-app-border shadow-app-modal",
            "max-h-[90vh] flex flex-col outline-none",
            "data-[state=open]:animate-app-modal-in data-[state=closed]:animate-app-modal-out",
            className
          )}
          style={{ maxWidth: width }}
        >
          <div className="flex items-center justify-between px-7 pt-6 pb-5 shrink-0">
            <Dialog.Title className="text-[18px] font-semibold text-app-1 tracking-[-0.01em]">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center rounded-app-sm text-app-4 hover:bg-app-active hover:text-app-3 transition-colors duration-150"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-7 pb-5 overflow-y-auto flex-1 min-h-0">{children}</div>

          {footer && (
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-app-border-light shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ModalFooterActions({
  onCancel,
  onConfirm,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  confirmDisabled = false,
}: {
  onCancel: () => void
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  confirmDisabled?: boolean
}) {
  return (
    <>
      <button type="button" onClick={onCancel} className={appBtnSecondary}>
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading || confirmDisabled}
        className={appBtnPrimary}
      >
        {confirmLabel}
      </button>
    </>
  )
}
