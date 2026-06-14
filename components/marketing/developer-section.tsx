"use client";

import Image from "next/image";
import { Container, Section } from "@/components/layout/page-shell-layout";
import { badgeSection, headingH2, headingH3, bodyLg } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";

const BENEFITS = [
  {
    emoji: "🧠",
    title: "Turn videos into context",
    description:
      "Turn your organization's video libraries into rich, queryable context — whether it's screen recordings, footage, or sales calls.",
  },
  {
    emoji: "📐",
    title: "Built for AI agents",
    description:
      "Snoolink is a video context system designed to work natively with AI agents and semantic search workflows.",
  },
  {
    emoji: "⚡",
    title: "Unparalleled speed & scale",
    description:
      "Search and reason across hundreds of videos in seconds. Fast indexing and responses, no matter the collection size.",
  },
  {
    emoji: "🏋️",
    title: "State-of-the-art understanding",
    description:
      "Multimodal understanding that keeps getting better — index once, search by meaning forever across your entire library.",
  },
] as const;

function BenefitRow({
  emoji,
  title,
  description,
  className,
}: (typeof BENEFITS)[number] & { className?: string }) {
  return (
    <article className={cn("text-left", className)}>
      <div className="flex gap-3 md:gap-4">
        <span className="text-xl md:text-2xl leading-none shrink-0 mt-0.5" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 space-y-2">
          <h3 className={cn(headingH3, "text-[clamp(1.05rem,2vw,1.35rem)]")}>{title}</h3>
          <p className={cn(bodyLg, "text-cg-ink-3")}>{description}</p>
        </div>
      </div>
    </article>
  );
}

export function DeveloperSection() {
  return (
    <Section id="docs" theme="alt" className="py-16 md:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* Left column */}
          <div className="text-left max-w-card">
            <span className={cn(badgeSection, "mb-6 md:mb-8")}>
              Built for developers, by developers.
            </span>

            <h2
              className={cn(
                headingH2,
                "text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.15] tracking-tight mb-6 md:mb-8"
              )}
            >
              Video-native, designed for AI ☁️
            </h2>

            <div className="space-y-4 mb-8 md:mb-10">
              <p className={cn(bodyLg, "text-cg-ink-3")}>
                Snoolink makes extracting data and reasoning over video as simple
                as uploading your library and describing what you need.
              </p>
              <p className={cn(bodyLg, "text-cg-ink-3")}>
                We handle the heavy lifting so you can focus on shipping great
                products.
              </p>
            </div>

            <div className="relative w-full max-w-[280px] aspect-square rounded-card overflow-hidden border-[1.5px] border-cg-line bg-gradient-to-br from-cg-line to-cg-bg-alt shadow-card p-6 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Snoolink mascot"
                width={200}
                height={200}
                className="w-[72%] h-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>

          {/* Right column — benefit rows */}
          <div className="flex flex-col gap-10 md:gap-12 lg:pt-2">
            {BENEFITS.map((benefit, i) => (
              <BenefitRow
                key={benefit.title}
                {...benefit}
                className={cn(
                  i > 0 && "pt-10 md:pt-12 border-t border-cg-line/80"
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
