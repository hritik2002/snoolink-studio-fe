"use client"

import { cn } from "@/lib/utils"

interface AppAvatarProps {
  name?: string | null
  email?: string | null
  className?: string
}

export function AppAvatar({ name, email, className }: AppAvatarProps) {
  const letter = (name?.[0] || email?.[0] || "U").toUpperCase()

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-app-sm bg-app-avatar flex items-center justify-center shrink-0",
        className
      )}
    >
      <span className="text-white text-sm font-bold leading-none">{letter}</span>
    </div>
  )
}
