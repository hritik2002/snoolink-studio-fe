import { Metadata } from "next"
import { Database } from "lucide-react"
import { appPageTitle } from "@/lib/app-classes"

export const metadata: Metadata = {
  title: "Data Connectors",
}

export default function ConnectorsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="px-6 pt-6 pb-4">
        <h1 className={appPageTitle}>Data Connectors</h1>
        <p className="text-[14px] text-app-3 mt-1">
          Connect external storage and ingest pipelines.
        </p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <div className="w-12 h-12 rounded-app-md border border-app-border-light bg-app-hover flex items-center justify-center mb-4">
          <Database className="h-6 w-6 text-app-3" />
        </div>
        <p className="text-[15px] font-medium text-app-1 mb-1">Coming soon</p>
        <p className="text-[13px] text-app-3 max-w-sm">
          Data connectors for S3, Google Drive, and more will be available here.
        </p>
      </div>
    </div>
  )
}
