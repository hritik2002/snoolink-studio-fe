import { Metadata } from "next"
import CollectionDetail from "@/components/collectionDetail"

export const metadata: Metadata = {
  title: "Collection",
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  return <CollectionDetail collectionName={decodeURIComponent(name)} />
}
