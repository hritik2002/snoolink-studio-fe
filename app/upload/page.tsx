import { redirect } from "next/navigation"
import { APP_ROUTES } from "@/lib/app-nav"

/**
 * /upload is deprecated. All uploads go through /app/uploads.
 */
export default function UploadRedirectPage() {
  redirect(APP_ROUTES.uploads)
}
