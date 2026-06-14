import { Metadata } from 'next'
import { Suspense } from 'react'
import HomeRouter from './home-router'
import { MarketingSkeleton } from '@/components/marketing/marketing-skeleton'

type Props = {
  searchParams: Promise<{ view?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const view = params?.view || 'search'
  
  const landingMetadata: Metadata = {
    title: 'Snoolink — Semantic Video & Image Search for AI',
    description:
      'Structure, search, and discover video and image content by meaning. AI-powered semantic search for media libraries.',
    openGraph: {
      title: 'Snoolink — Semantic Video & Image Search for AI',
      description:
        'The easiest way to structure, search, and discover video and image content by meaning.',
      url: 'https://app.snoolink.com',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Snoolink — Semantic Video & Image Search for AI',
      description:
        'Structure, search, and discover media by meaning — not keywords.',
    },
    alternates: {
      canonical: 'https://app.snoolink.com',
    },
  }

  const metadataMap: Record<string, Metadata> = {
    search: {
      title: 'AI-Powered Semantic Search | Snoolink',
      description: 'Search your video and image library by meaning, not keywords. Find specific moments instantly with AI-powered semantic search.',
      openGraph: {
        title: 'AI-Powered Semantic Search | Snoolink',
        description: 'Search your media library by meaning with AI.',
        url: 'https://app.snoolink.com/?view=search',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'AI-Powered Semantic Search | Snoolink',
        description: 'Search your media library by meaning with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=search',
      },
    },
    collections: {
      title: 'Media Collections | Snoolink',
      description: 'Organize and manage your video and image collections. Group related media for easy access and search.',
      openGraph: {
        title: 'Media Collections | Snoolink',
        description: 'Organize your media into collections.',
        url: 'https://app.snoolink.com/?view=collections',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Media Collections | Snoolink',
        description: 'Organize your media into collections.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=collections',
      },
    },
    uploads: {
      title: 'Upload Media | Snoolink',
      description: 'Upload videos and images to Snoolink. Our AI will automatically index your media for semantic search.',
      openGraph: {
        title: 'Upload Media | Snoolink',
        description: 'Upload and index your media with AI.',
        url: 'https://app.snoolink.com/?view=uploads',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Upload Media | Snoolink',
        description: 'Upload and index your media with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=uploads',
      },
    },
  }

  return metadataMap[view] || landingMetadata
}

export default async function Home({ searchParams }: Props) {
  return (
    <Suspense fallback={<MarketingSkeleton />}>
      <HomeRouter />
    </Suspense>
  )
}
