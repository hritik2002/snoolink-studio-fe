"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { btnLight } from "@/lib/cg-classes";

const NAV_LINKS = [
  { label: "Use Cases", href: "#features" },
  { label: "Search", href: "#search" },
  { label: "Docs", href: "#docs" },
  { label: "Pricing", href: "#pricing" },
];

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", className)}
      aria-hidden
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

interface MarketingNavProps {
  onLogin: () => void;
  loading?: boolean;
}

export function MarketingNav({ onLogin, loading }: MarketingNavProps) {
  return (
    <div className="sticky top-3 md:top-4 z-50 px-4 md:px-9 lg:px-15 pointer-events-none">
      <nav
        className={cn(
          "pointer-events-auto max-w-page mx-auto",
          "flex items-center justify-between gap-4 md:gap-6",
          "h-14 md:h-[3.75rem] px-4 md:px-6",
          "rounded-cta bg-cg-bg/95 backdrop-blur-xl",
          "border border-cg-line shadow-card"
        )}
        aria-label="Main"
      >
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="size-7 md:size-8 object-contain"
            priority
          />
          <span className="font-ui text-body font-medium text-cg-ink tracking-tight truncate">
            Snoolink
          </span>
        </Link>

        <div className="hidden lg:flex items-center justify-center gap-7 xl:gap-9 flex-1 min-w-0">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-ui text-body text-cg-ink-2 whitespace-nowrap transition-colors duration-200 ease-cg hover:text-cg-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={onLogin}
          disabled={loading}
          className={cn(
            btnLight,
            "px-[26px] py-[10px] text-sm shrink-0 group h-auto"
          )}
        >
          {loading ? "…" : "Login"}
          {!loading && (
            <ArrowIcon className="transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          )}
        </button>
      </nav>
    </div>
  );
}
