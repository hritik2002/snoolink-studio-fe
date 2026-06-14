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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="glue-card max-w-md w-full p-10 relative text-center">
        <p className="font-mono text-5xl font-bold text-[var(--color-accent-orange)] mb-2">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2 font-[family-name:var(--font-display)]">Page not found</h1>
        <p className="text-[15px] text-muted-foreground mb-8">
          This page doesn&apos;t exist or was moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-base font-medium rounded-[18px] shadow-[var(--shadow-btn-dark)] hover:-translate-y-0.5 transition-transform"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
