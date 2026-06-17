import { redirect } from "next/navigation"
import { DEFAULT_APP_PATH } from "@/lib/app-nav"

export default function AppIndexPage() {
  redirect(DEFAULT_APP_PATH)
}
