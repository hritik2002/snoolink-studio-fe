import { Metadata } from "next"
import ImageCollections from "@/components/imageCollections"

export const metadata: Metadata = {
  title: "Uploads",
}

export default function UploadsPage() {
  return <ImageCollections />
}
