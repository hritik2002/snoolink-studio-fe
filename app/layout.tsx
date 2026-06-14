import type { Metadata } from "next";
import { Inter, Urbanist } from "next/font/google";
import { Fragment_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { Toaster } from "@/components/ui/toaster";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { PopupManagerWrapper } from "@/components/popups/PopupManagerWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["600", "900"],
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  variable: "--font-fragment-mono",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.snoolink.com'),
  title: {
    default: "Snoolink - AI-Powered Semantic Video & Image Search Platform",
    template: "%s | Snoolink"
  },
  description: "Transform how you find content with Snoolink's AI-powered semantic search. Upload videos and images, search by meaning, not just keywords. Perfect for content creators, videographers, and media professionals. Get instant, intelligent results across your entire media library.",
  keywords: [
    "semantic video search",
    "AI video search",
    "intelligent media search",
    "content discovery platform",
    "search videos by meaning",
    "AI-powered image search",
    "video content management",
    "media asset management",
    "visual search engine",
    "video search for creators",
    "professional video organization",
    "media library search",
    "smart video indexing",
    "machine learning search",
    "computer vision platform",
    "neural search technology",
    "deep learning video analysis",
    "find specific moments in videos",
    "search video content by description",
    "organize video library automatically",
    "AI video indexing service"
  ],
  authors: [{ name: "Snoolink", url: "https://app.snoolink.com" }],
  creator: "Snoolink",
  publisher: "Snoolink",
  applicationName: "Snoolink",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.snoolink.com",
    siteName: "Snoolink",
    title: "Snoolink - AI-Powered Semantic Video & Image Search",
    description: "Transform how you find content with AI-powered semantic search. Upload videos and images, search by meaning. Perfect for content creators and media professionals.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Snoolink - AI Video Search Platform",
        type: "image/png",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SnoolinkStudio",
    creator: "@SnoolinkStudio",
    title: "Snoolink - AI-Powered Semantic Video & Image Search",
    description: "Transform how you find content with AI-powered semantic search. Upload videos and images, search by meaning instantly.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://app.snoolink.com",
  },
  category: "technology",
  classification: "AI-Powered Media Search Platform",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "application-name": "Snoolink",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Snoolink",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#fefefe",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-tap-highlight": "no",
    "theme-color": "#fefefe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Snoolink",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "AI-powered semantic search platform for videos and images. Upload your media and search by meaning, not just keywords.",
    "url": "https://app.snoolink.com",
    "screenshot": "https://app.snoolink.com/og-image.png",
    "featureList": [
      "Semantic video search",
      "AI-powered image search",
      "Intelligent media organization",
      "Content discovery by meaning",
      "Automated video indexing",
      "Collection management"
    ],
    "applicationSubCategory": "Media Management Software"
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Snoolink",
    "url": "https://app.snoolink.com",
    "logo": "https://app.snoolink.com/logo.png",
    "description": "AI-powered semantic search platform for videos and images",
    "sameAs": [
      "https://twitter.com/SnoolinkStudio",
      "https://www.linkedin.com/company/snoolink"
    ]
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${urbanist.variable} ${fragmentMono.variable} font-sans antialiased min-h-screen bg-background text-foreground overflow-x-hidden`}
        style={{
          ["--font-sans" as string]: "var(--font-inter), system-ui, sans-serif",
          ["--font-body" as string]: "var(--font-inter), system-ui, sans-serif",
          ["--font-display" as string]: "var(--font-urbanist), var(--font-inter), system-ui, sans-serif",
          ["--font-mono" as string]: "var(--font-fragment-mono), ui-monospace, monospace",
          ["--font-popup" as string]: "var(--font-body)",
        }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-[18px]"
        >
          Skip to main content
        </a>
        <GoogleAnalytics />
        <AuthProvider>
          <OnboardingProvider>
            <AnalyticsProvider>
              {children}
              <Toaster />
              <PopupManagerWrapper />
            </AnalyticsProvider>
          </OnboardingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
