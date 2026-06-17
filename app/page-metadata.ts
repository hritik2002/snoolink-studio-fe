import { Metadata } from 'next'

/**
 * Generate metadata for the homepage based on view query parameter
 * This is used by a server component wrapper since page.tsx is a client component
 */
export async function generatePageMetadata(
  searchParams: Promise<{ view?: string }>
): Promise<Metadata> {
  const params = await searchParams
  const view = params?.view || 'search'
  
  const metadataMap: Record<string, Metadata> = {
    search: {
      title: 'AI-Powered Semantic Search | Snoolink',
      description: 'Search your video and image library by meaning, not keywords. Find specific moments instantly with AI-powered semantic search.',
      openGraph: {
        title: 'AI-Powered Semantic Search | Snoolink',
        description: 'Search your media library by meaning with AI.',
        url: 'https://app.snoolink.com/app/search',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'AI-Powered Semantic Search | Snoolink',
        description: 'Search your media library by meaning with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/app/search',
      },
    },
    collections: {
      title: 'Media Collections | Snoolink',
      description: 'Organize and manage your video and image collections. Group related media for easy access and search.',
      openGraph: {
        title: 'Media Collections | Snoolink',
        description: 'Organize your media into collections.',
        url: 'https://app.snoolink.com/app/collections',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Media Collections | Snoolink',
        description: 'Organize your media into collections.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/app/collections',
      },
    },
    uploads: {
      title: 'Upload Media | Snoolink',
      description: 'Upload videos and images to Snoolink. Our AI will automatically index your media for semantic search.',
      openGraph: {
        title: 'Upload Media | Snoolink',
        description: 'Upload and index your media with AI.',
        url: 'https://app.snoolink.com/app/uploads',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Upload Media | Snoolink',
        description: 'Upload and index your media with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/app/uploads',
      },
    },
  }

  return metadataMap[view] || metadataMap.search
}
