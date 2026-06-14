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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#010010] dot-grid px-4">
      <div className="beetle-card max-w-md w-full p-10 relative text-center">
        <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
        <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
        <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
        <span className="beetle-bracket beetle-bracket-br" aria-hidden />
        <p className="font-mono-beetle text-5xl font-bold text-primary mb-2">404</p>
        <h1 className="text-lg font-medium text-white mb-2">Page not found</h1>
        <p className="text-[13px] text-[#71717a] mb-8">
          This page doesn&apos;t exist or was moved.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-black text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return home
        </Link>
      </div>
    </div>
  )
}
