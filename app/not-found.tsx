import Link from 'next/link'
import { Metadata } from 'next'
import { PageShell, Section, Container } from '@/components/layout/page-shell-layout'
import { cardFeature, cardSurface, headingH3, btnDark } from '@/lib/cg-classes'
import { cn } from '@/lib/utils'
 
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
    <PageShell>
      <Section className="min-h-screen justify-center py-12">
        <Container className="max-w-md">
          <div className={cn(cardFeature, "p-1")}>
            <div className={cn(cardSurface, "text-center border-0 shadow-none")}>
              <p className="font-mono text-5xl font-bold text-cg-orange mb-2">404</p>
              <h1 className={cn(headingH3, "mb-2")}>Page not found</h1>
              <p className="font-body text-sm text-cg-ink-4 mb-8">
                This page doesn&apos;t exist or was moved.
              </p>
              <Link href="/" className={btnDark}>
                Return home
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
