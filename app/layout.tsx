import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://snoolink-studio-fe.vercel.app/'),
  title: {
    default: "Snoolink Studio - AI-Powered Semantic Image & Video Search",
    template: "%s | Snoolink Studio"
  },
  description: "Discover and search through your images and videos with AI-powered semantic search. Snoolink Studio uses advanced machine learning to understand content meaning, making it easy to find exactly what you're looking for.",
  keywords: [
    "semantic search",
    "AI image search",
    "video search",
    "machine learning",
    "content discovery",
    "visual search",
    "AI-powered search",
    "image organization",
    "video organization",
    "media management",
    "computer vision",
    "neural search"
  ],
  authors: [{ name: "Snoolink AI" }],
  creator: "Snoolink AI",
  publisher: "Snoolink AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Snoolink Studio",
    title: "Snoolink Studio - AI-Powered Semantic Image & Video Search",
    description: "Discover and search through your images and videos with AI-powered semantic search. Find exactly what you're looking for with advanced machine learning.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Snoolink Studio - AI-Powered Semantic Image & Video Search",
    description: "Discover and search through your images and videos with AI-powered semantic search.",
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
  classification: "AI Search Platform",
  other: {
    "application-name": "Snoolink Studio",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Snoolink Studio",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#7c3aed",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#7c3aed",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-gray-50`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
