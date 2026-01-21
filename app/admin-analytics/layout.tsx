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
