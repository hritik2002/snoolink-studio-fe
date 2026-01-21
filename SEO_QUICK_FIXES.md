# SEO Quick Fixes - Implementation Guide

## 🔴 Critical Fixes (Do First)

### 1. Remove Fake Schema Rating

**File:** `app/layout.tsx`

**Current Code (lines 149-153):**
```typescript
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "250"
}
```

**Fix:**
```typescript
// Remove the aggregateRating entirely, or only include if you have real reviews
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Snoolink Studio",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  // ❌ REMOVED: aggregateRating (fake data)
  "description": "AI-powered semantic search platform for videos and images...",
  // ... rest of schema
};
```

---

### 2. Enable Image Optimization

**File:** `components/imageSearch.tsx`

**Current Code (lines 922-938):**
```typescript
<Image
  src={result.imageUrl}
  alt={sceneSummary}
  fill
  className="object-cover"
  unoptimized  // ❌ REMOVE THIS
/>
```

**Fix:**
```typescript
<Image
  src={result.imageUrl}
  alt={sceneSummary}
  fill
  className="object-cover"
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={85}
/>
```

**Also update:** `components/imageCollections.tsx` and any other files using `unoptimized`

---

### 3. Add Noindex to Admin Pages

**Create:** `app/admin/layout.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

**Create:** `app/admin-analytics/layout.tsx`

```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Analytics',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminAnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
```

---

## 🟠 High Priority Fixes

### 4. Add Metadata for Query Parameter Views

**File:** `app/page.tsx`

**Add this function:**
```typescript
import { Metadata } from 'next'

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ view?: string }> }
): Promise<Metadata> {
  const params = await searchParams
  const view = params?.view || 'search'
  
  const metadataMap: Record<string, Metadata> = {
    search: {
      title: 'AI-Powered Semantic Search | Snoolink Studio',
      description: 'Search your video and image library by meaning, not keywords. Find specific moments instantly with AI-powered semantic search.',
      openGraph: {
        title: 'AI-Powered Semantic Search | Snoolink Studio',
        description: 'Search your media library by meaning with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=search',
      },
    },
    collections: {
      title: 'Media Collections | Snoolink Studio',
      description: 'Organize and manage your video and image collections. Group related media for easy access and search.',
      openGraph: {
        title: 'Media Collections | Snoolink Studio',
        description: 'Organize your media into collections.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=collections',
      },
    },
    uploads: {
      title: 'Upload Media | Snoolink Studio',
      description: 'Upload videos and images to Snoolink Studio. Our AI will automatically index your media for semantic search.',
      openGraph: {
        title: 'Upload Media | Snoolink Studio',
        description: 'Upload and index your media with AI.',
      },
      alternates: {
        canonical: 'https://app.snoolink.com/?view=uploads',
      },
    },
  }

  return metadataMap[view] || metadataMap.search
}
```

**Note:** You'll need to convert `page.tsx` to handle async searchParams. See Next.js 15 docs for the pattern.

---

### 5. Expand Sitemap

**File:** `app/sitemap.ts`

**Update to:**
```typescript
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://app.snoolink.com'
  const currentDate = new Date()

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/?view=search`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/?view=collections`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/?view=uploads`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    // Add more pages as needed
  ]
}
```

---

## 🟡 Medium Priority

### 6. Verify H1 Tags Are Server-Rendered

**Check:** Ensure H1 in `components/imageSearch.tsx` is visible in initial HTML

**If needed, add server-rendered H1:**
```typescript
// In app/page.tsx or a server component wrapper
export default async function Home() {
  return (
    <>
      <h1 className="sr-only">Snoolink Studio - AI-Powered Semantic Search</h1>
      {/* Your existing client component */}
    </>
  )
}
```

---

## Testing Checklist

After implementing fixes:

- [ ] Run `npm run build` - check for errors
- [ ] Test images load correctly
- [ ] Verify metadata in page source (View Source)
- [ ] Check robots.txt: `https://app.snoolink.com/robots.txt`
- [ ] Check sitemap: `https://app.snoolink.com/sitemap.xml`
- [ ] Test with Google Rich Results Test
- [ ] Test with PageSpeed Insights
- [ ] Verify admin pages return `noindex` in headers

---

## Quick Wins Summary

1. ✅ Remove fake schema rating (5 min)
2. ✅ Add noindex to admin pages (10 min)
3. ✅ Remove `unoptimized` from images (15 min)
4. ✅ Expand sitemap (10 min)
5. ✅ Add metadata for views (30 min)

**Total time for quick wins: ~1.5 hours**
