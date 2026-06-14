"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Container, Section } from "@/components/layout/page-shell-layout";
import { btnDark, headingH2, bodyLg } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";

interface MarketingCtaProps {
  onGetStarted: () => void;
  loading?: boolean;
}

export function MarketingCta({ onGetStarted, loading }: MarketingCtaProps) {
  return (
    <Section id="pricing" theme="alt" className="py-16 md:py-20 lg:py-24">
      <Container>
        <div
          className={cn(
            "flex flex-col items-center text-center mx-auto max-w-card",
            "rounded-cta bg-cg-bg border border-cg-line px-6 py-14 md:py-16 lg:py-20"
          )}
        >
          <Image
            src="/logo.png"
            alt=""
            width={48}
            height={48}
            className="size-12 object-contain mb-6"
          />

          <h2
            className={cn(
              headingH2,
              "text-[clamp(1.75rem,4vw,2.5rem)] mb-4 tracking-tight"
            )}
          >
            Ready to build?
          </h2>

          <p className={cn(bodyLg, "text-cg-ink-3 max-w-prose mb-8 md:mb-10")}>
            Turn your videos into LLM-ready context. No credit card necessary.
          </p>

          <button
            type="button"
            onClick={onGetStarted}
            disabled={loading}
            className={cn(
              btnDark,
              "px-8 py-3.5 group",
              loading && "opacity-60 pointer-events-none"
            )}
          >
            {loading ? "Redirecting…" : "Get started"}
            {!loading && (
              <ArrowUpRight
                className="size-4 transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            )}
          </button>
        </div>
      </Container>
    </Section>
  );
}
