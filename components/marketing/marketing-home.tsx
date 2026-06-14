"use client";

import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageShell, Section, Container } from "@/components/layout/page-shell-layout";
import { btnLight, badgeSection, headingHero, headingH2, bodyLg, badge } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";
import { useGoogleSignIn } from "@/hooks/use-google-sign-in";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { LogoMarquee } from "@/components/marketing/logo-marquee";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { DeveloperSection } from "@/components/marketing/developer-section";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export function MarketingHome() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const { signIn, loading, error } = useGoogleSignIn();

  return (
    <PageShell className="flex flex-col">
      {/* Rainbow accent strip */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: "var(--gradient-hero-blob)" }}
        aria-hidden
      />

      {/* Announcement bar */}
      <div className="announcement-bar shrink-0 px-4 py-2.5 text-center text-sm font-body">
        <p className="text-white/90">
          Introducing{" "}
          <strong className="font-semibold text-white">Snoolink</strong>
          {" — "}Semantic search for video &amp; image libraries{" "}
          <span className="text-cg-neon">→</span>
        </p>
      </div>

      {/* Social / launch bar */}
      <div
        className="shrink-0 px-4 py-2 text-center text-sm font-body font-medium text-cg-ink"
        style={{
          background:
            "linear-gradient(90deg, #ffb340 0%, #f6d93a 40%, #ffe208 70%, #ffb340 100%)",
        }}
      >
        AI-powered media search — find any moment by meaning
      </div>

      <MarketingNav onLogin={() => signIn()} loading={loading} />

      {/* Hero — above the fold */}
      <section className="hero-blob relative flex flex-col items-center justify-center px-4 md:px-9 pt-8 pb-20 md:pt-12 md:pb-28 min-h-[calc(100svh-11rem)]">
        <div className="relative z-10 flex flex-col items-center text-center max-w-prose mx-auto">
          {reason === "expired" && (
            <div className="mb-6 w-full max-w-md px-4 py-2.5 border border-cg-line bg-cg-bg-alt text-cg-ink text-sm rounded-badge">
              Session expired. Sign in again to continue.
            </div>
          )}

          {error && (
            <div className="mb-6 w-full max-w-md px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 text-sm rounded-badge">
              {error}
            </div>
          )}

          <span className={cn(badgeSection, "mb-8")}>
            <Sparkles className="size-4 text-cg-orange" aria-hidden />
            Purpose-built for AI agents
          </span>

          <h1
            className={cn(
              headingHero,
              "text-[clamp(2rem,6vw,4rem)] md:text-hero max-w-[16ch] mb-6"
            )}
          >
            Video context engine for AI
          </h1>

          <p className={cn(bodyLg, "max-w-prose mb-10 text-cg-ink-3")}>
            The API to structure, search, and reason over video context for
            developers.
          </p>

          <button
            type="button"
            onClick={() => signIn()}
            disabled={loading}
            className={cn(
              btnLight,
              "px-8 py-3.5 text-body group",
              loading && "opacity-60 pointer-events-none"
            )}
          >
            {loading ? "Redirecting…" : "Try Snoolink (it's free!)"}
            {!loading && (
              <ArrowUpRight
                className="size-4 transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            )}
          </button>
        </div>
      </section>

      {/* Logo marquee — visible on scroll */}
      <LogoMarquee />

      {/* Secondary value prop — post-scroll section */}
      <Section id="use-cases" theme="alt" className="py-20 md:py-[142px]">
        <Container className="flex flex-col items-center text-center">
          <span className={cn(badge, "mb-8 max-w-lg text-center leading-snug")}>
            Power incredible applications that understand video content
          </span>

          <h2
            className={cn(
              headingH2,
              "text-[clamp(1.75rem,5vw,3.25rem)] max-w-[22ch] mb-6"
            )}
          >
            The easiest way to turn videos into context for AI.
          </h2>

          <p className={cn(bodyLg, "max-w-prose text-cg-ink-3 mb-10")}>
            Snoolink makes it effortless to extract insights from video, and for
            AI to reason across your media library at scale.
          </p>

          <button
            type="button"
            onClick={() => signIn()}
            disabled={loading}
            className={cn(
              btnLight,
              "px-8 py-3.5 text-body group",
              loading && "opacity-60 pointer-events-none"
            )}
          >
            Get started
            {!loading && (
              <ArrowUpRight
                className="size-4 transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            )}
          </button>
        </Container>
      </Section>

      {/* Feature grid — use cases */}
      <FeatureGrid />

      {/* Built for developers — two-column benefits */}
      <DeveloperSection />

      <MarketingCta onGetStarted={() => signIn()} loading={loading} />

      <MarketingFooter />
    </PageShell>
  );
}
