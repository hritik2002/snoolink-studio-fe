import { Metadata } from "next"
import ImageSearch from "@/components/imageSearch"

export const metadata: Metadata = {
  title: "Search",
}

export default function SearchPage() {
  return <ImageSearch />
}
