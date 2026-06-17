import { Metadata } from "next"
import { Suspense } from "react"
import Files from "@/components/files"
import { AppPageLoader } from "@/components/app/AppSpinner"

export const metadata: Metadata = {
  title: "Files",
}

export default function UploadsPage() {
  return (
    <Suspense fallback={<AppPageLoader />}>
      <Files />
    </Suspense>
  )
}
