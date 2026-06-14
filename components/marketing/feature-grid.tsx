"use client";

import {
  MessageSquare,
  BarChart3,
  Network,
  Pencil,
  Play,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Container, Section } from "@/components/layout/page-shell-layout";
import { cardFeature, cardFeatureInner, headingH3, bodyLg } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";

function FeatureIconButton({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div
      className={cn(
        "shrink-0 size-10 rounded-icon flex items-center justify-center",
        "bg-cg-surface border border-cg-line-2/80 shadow-btn-light"
      )}
      aria-hidden
    >
      <Icon className="size-[18px] text-cg-orange stroke-[1.75]" />
    </div>
  );
}

function ChatRagMockup() {
  return (
    <div className="relative h-48 md:h-56 w-full rounded-img bg-gradient-to-br from-cg-peach/40 to-cg-bg-warm overflow-hidden border border-cg-line/60">
      <div className="absolute left-4 top-4 w-[42%] space-y-2">
        <div className="h-16 rounded-badge bg-cg-surface/90 border border-cg-line shadow-card p-2">
          <div className="h-1.5 w-3/4 rounded-full bg-cg-orange/30 mb-1.5" />
          <div className="h-1.5 w-full rounded-full bg-cg-line-3" />
          <div className="h-1.5 w-5/6 rounded-full bg-cg-line-3 mt-1" />
        </div>
        <div className="h-8 w-[85%] ml-auto rounded-badge bg-cg-orange/15 border border-cg-orange/20" />
      </div>
      <div className="absolute right-3 bottom-3 w-[52%] h-[58%] rounded-badge bg-cg-surface border border-cg-line shadow-card-md overflow-hidden">
        <div className="h-full bg-gradient-to-br from-cg-orange/25 via-cg-peach/30 to-cg-bg-warm flex items-end justify-center pb-3">
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="size-6 rounded-full bg-cg-orange/40 border border-cg-orange/30" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 h-1 rounded-full bg-cg-ink/10">
          <div className="h-full w-1/3 rounded-full bg-cg-orange/60" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  return (
    <div className="relative h-48 md:h-56 w-full rounded-img bg-gradient-to-br from-cg-peach/30 to-cg-bg-alt overflow-hidden border border-cg-line/60 p-4">
      <div className="grid grid-cols-3 gap-2 h-full">
        <div className="col-span-2 rounded-badge bg-cg-surface/90 border border-cg-line p-3 flex flex-col justify-end">
          <svg viewBox="0 0 200 80" className="w-full h-16 text-cg-orange" aria-hidden>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeOpacity="0.7"
              points="0,70 30,55 60,62 90,35 120,42 150,20 180,28 200,12"
            />
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.35"
              points="0,75 40,68 80,60 120,50 160,45 200,38"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <div className="h-[45%] rounded-badge bg-cg-orange/20 border border-cg-orange/25" />
          <div className="h-[45%] rounded-badge bg-cg-surface/90 border border-cg-line" />
        </div>
      </div>
    </div>
  );
}

function SchemaMockup() {
  const nodes = [
    { y: 18, dashed: false },
    { y: 38, dashed: true },
    { y: 58, dashed: false },
    { y: 78, dashed: true },
  ];

  return (
    <div className="relative h-48 md:h-56 w-full rounded-img bg-gradient-to-br from-cg-bg-warm/80 to-cg-peach/20 overflow-hidden border border-cg-line/60 p-4 md:p-5">
      <div className="relative flex items-center justify-between h-full gap-3">
        {/* Source nodes */}
        <div className="flex flex-col justify-between h-[85%] py-1 shrink-0 w-[28%] max-w-[5.5rem]">
          {nodes.map((node, i) => (
            <div
              key={i}
              className="h-7 md:h-8 rounded-badge bg-cg-surface border-[1.5px] border-cg-orange/45 shadow-sm"
            />
          ))}
        </div>

        {/* Connector lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none text-cg-orange"
          viewBox="0 0 320 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          {nodes.map((node, i) => (
            <line
              key={i}
              x1="88"
              y1={24 + i * 24}
              x2="215"
              y2="60"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.55"
              strokeDasharray={node.dashed ? "4 4" : undefined}
            />
          ))}
        </svg>

        {/* Output video block */}
        <div className="flex-1 max-w-[58%] h-[72%] rounded-badge bg-cg-surface border-[1.5px] border-cg-orange/50 shadow-card-md flex items-center justify-center relative">
          <div className="absolute inset-3 rounded-[18px] bg-gradient-to-br from-cg-orange/15 via-cg-peach/25 to-cg-bg-warm border border-cg-orange/20" />
          <div className="relative z-10 size-11 rounded-full bg-cg-surface border border-cg-line-2 shadow-btn-light flex items-center justify-center">
            <Play className="size-4 text-cg-orange fill-cg-orange/20 ml-0.5" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchMockup() {
  return (
    <div className="relative h-48 md:h-56 w-full rounded-img bg-gradient-to-br from-cg-peach/25 to-cg-bg-warm/90 overflow-hidden p-3 md:p-4">
      <div className="h-full rounded-[22px] border-[1.5px] border-cg-orange/55 bg-cg-surface/95 shadow-card-md flex flex-col overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 p-3 md:p-4 space-y-3 overflow-hidden">
          {/* User query — right aligned */}
          <div className="flex justify-end">
            <p className="max-w-[92%] text-right font-body text-[11px] md:text-xs leading-snug text-cg-orange">
              where did we delight customers in sales recordings this week?
            </p>
          </div>

          {/* AI response — left aligned */}
          <div className="space-y-2">
            <p className="font-body text-[11px] md:text-xs text-cg-ink-3">
              Here they are!
            </p>
            <div className="flex gap-1.5 md:gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 aspect-[4/3] max-h-14 rounded-[10px] bg-gradient-to-br from-cg-orange/20 to-cg-peach/30 border border-cg-orange/25 relative overflow-hidden"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="size-5 rounded-full bg-cg-surface/90 border border-cg-line flex items-center justify-center shadow-sm">
                      <Play className="size-2.5 text-cg-orange fill-cg-orange/15 ml-px" aria-hidden />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-cg-line px-3 py-2 flex items-center gap-2 bg-cg-bg-warm/50">
          <div className="flex-1 h-8 rounded-badge bg-cg-bg-warm border border-cg-line-3" />
          <button
            type="button"
            className="size-8 shrink-0 rounded-full bg-cg-orange/15 border border-cg-orange/30 flex items-center justify-center"
            tabIndex={-1}
            aria-hidden
          >
            <Send className="size-3.5 text-cg-orange" />
          </button>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Semantic search across your library",
    description:
      "Enable agents and apps to answer questions across video and image content, complete with playable citations.",
    icon: MessageSquare,
    illustration: ChatRagMockup,
  },
  {
    title: "Analyze thousands of hours of video, fast",
    description:
      "Run aggregate analysis across your media library and generate reports at scale.",
    icon: BarChart3,
    illustration: AnalyticsMockup,
  },
  {
    title: "Extract structured data consistently",
    description:
      "Define schemas and extract entities consistently across videos.",
    icon: Network,
    illustration: SchemaMockup,
  },
  {
    title: "Search anything across videos",
    description:
      "Find and retrieve relevant videos and segments at scale.",
    icon: Pencil,
    illustration: SearchMockup,
  },
] as const;

function FeatureCard({
  title,
  description,
  icon,
  illustration: Illustration,
}: (typeof FEATURES)[number]) {
  return (
    <article className={cn(cardFeature, "p-1")}>
      <div className={cn(cardFeatureInner, "h-full gap-5 md:gap-6 text-left")}>
        <div className="flex items-start justify-between gap-4">
          <h3 className={cn(headingH3, "text-[clamp(1.125rem,2.5vw,1.5rem)] pr-2")}>
            {title}
          </h3>
          <FeatureIconButton icon={icon} />
        </div>
        <p className={cn(bodyLg, "text-cg-ink-3 text-left")}>{description}</p>
        <Illustration />
      </div>
    </article>
  );
}

export function FeatureGrid() {
  return (
    <Section id="features" theme="light" className="py-16 md:py-20 lg:py-24">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
