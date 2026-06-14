"use client";

import { CloudUpload, Search, ArrowUpRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  badgeSection,
  btnLight,
  headingH3,
  bodyLg,
} from "@/lib/cg-classes";

interface EmptyStateSearchProps {
  hasContent: boolean;
  searchQuery?: string;
  onExampleClick?: (query: string) => void;
  exampleQueries?: string[];
}

export function EmptyStateSearch({
  hasContent,
  searchQuery,
  onExampleClick,
  exampleQueries = [],
}: EmptyStateSearchProps) {
  const router = useRouter();

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-16 md:py-24">
        <div className="relative max-w-md w-full">
          <div className="glue-card-accent" aria-hidden />
          <div className="glue-card p-1">
            <div className="glue-card-inner p-8 md:p-10 text-center space-y-6">
              <div
                className="mx-auto size-14 rounded-icon flex items-center justify-center bg-cg-surface border border-cg-line-2 shadow-btn-light"
                aria-hidden
              >
                <CloudUpload className="size-6 text-cg-orange stroke-[1.75]" />
              </div>
              <div className="space-y-2">
                <h3 className={headingH3}>No media yet</h3>
                <p className={cn(bodyLg, "text-cg-ink-4 max-w-[28ch] mx-auto")}>
                  Upload files to index them. Then search by meaning, not
                  keywords.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/?view=uploads")}
                className={cn(btnLight, "w-full group text-body")}
              >
                Upload media
                <ArrowUpRight
                  className="size-4 transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-20 text-center">
        <div
          className="mb-5 size-12 rounded-icon flex items-center justify-center bg-cg-bg-warm border border-cg-line"
          aria-hidden
        >
          <Search className="size-5 text-cg-ink-4 stroke-[1.75]" />
        </div>
        <p className="font-body text-body text-cg-ink mb-1">
          No results for &ldquo;{searchQuery}&rdquo;
        </p>
        <p className="font-body text-sm text-cg-ink-4">
          Try broader terms or a different query.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 md:py-20 text-center">
      <span className={cn(badgeSection, "mb-6 md:mb-8")}>
        <Sparkles className="size-4 text-cg-orange" aria-hidden />
        Semantic search
      </span>

      <h2
        className={cn(
          headingH3,
          "text-[clamp(1.5rem,4vw,2rem)] max-w-[18ch] mb-4 tracking-tight"
        )}
      >
        Find any moment by meaning
      </h2>

      <p className={cn(bodyLg, "max-w-prose mb-8 md:mb-10 text-cg-ink-4")}>
        Describe what you&apos;re looking for. We match by meaning, not
        keywords.
      </p>

      {exampleQueries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {exampleQueries.slice(0, 4).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onExampleClick?.(q)}
              className={cn(
                btnLight,
                "px-4 py-2.5 text-sm h-auto group"
              )}
            >
              {q}
              <ArrowUpRight
                className="size-3.5 opacity-50 transition-transform duration-200 ease-cg group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
