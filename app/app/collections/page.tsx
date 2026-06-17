import { Metadata } from "next"
import Collections from "@/components/collections"

export const metadata: Metadata = {
  title: "Collections",
}

export default function CollectionsPage() {
  return <Collections />
}
