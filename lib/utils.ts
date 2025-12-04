import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL || "https://snoolink-studio-fe.vercel.app"
  )
}

export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`
}
