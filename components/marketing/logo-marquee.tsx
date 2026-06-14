"use client";

import { cn } from "@/lib/utils";

const LOGOS = [
  "Snapchat",
  "Amazon",
  "Carnegie Mellon",
  "RBC",
  "Snapchat",
  "Amazon",
  "Carnegie Mellon",
  "RBC",
];

function LogoWordmark({ name }: { name: string }) {
  return (
    <span
      className={cn(
        "shrink-0 font-body text-lg md:text-xl font-semibold tracking-tight",
        "text-cg-ink-4/50 select-none whitespace-nowrap"
      )}
      aria-hidden
    >
      {name}
    </span>
  );
}

export function LogoMarquee() {
  const track = [...LOGOS, ...LOGOS];

  return (
    <section
      className="w-full py-12 md:py-15 border-y border-cg-line bg-cg-bg"
      aria-label="Trusted by teams at"
    >
      <p className="font-body text-sm text-cg-ink-4 text-center mb-8 md:mb-10">
        Used by developers from
      </p>
      <div className="logo-marquee relative overflow-hidden">
        <div className="logo-marquee-track flex items-center gap-12 md:gap-20 w-max">
          {track.map((name, i) => (
            <LogoWordmark key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
