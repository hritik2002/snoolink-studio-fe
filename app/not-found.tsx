import Link from 'next/link'
import { Metadata } from 'next'
 
export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: {
    index: false,
    follow: false,
  },
}
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dot-grid">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-[6px] hover:bg-primary/90 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
