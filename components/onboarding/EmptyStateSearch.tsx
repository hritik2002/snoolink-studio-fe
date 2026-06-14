"use client";

import { CloudUpload, Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
      <div className="flex flex-col items-center justify-center flex-1 py-20 px-4">
        <div className="beetle-card max-w-sm w-full p-8 relative backdrop-blur-3xl">
          <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
          <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-br" aria-hidden />

          <div className="text-center space-y-4">
            <CloudUpload className="h-8 w-8 text-primary mx-auto" strokeWidth={1.5} aria-hidden />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">No media yet</h3>
              <p className="text-sm text-white/60 leading-relaxed max-w-[28ch] mx-auto">
                Upload files to index them. Then search by meaning.
              </p>
            </div>
            <Button
              variant="beetle"
              className="w-full group"
              onClick={() => router.push("/?view=uploads")}
            >
              Upload media
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
        <Search className="h-6 w-6 text-[#71717a] mb-4" strokeWidth={1.5} aria-hidden />
        <p className="text-white/80 text-sm mb-1">No results for &ldquo;{searchQuery}&rdquo;</p>
        <p className="text-[13px] text-[#71717a]">Try broader terms or a different query.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
      <Search className="h-6 w-6 text-[#71717a] mb-4" strokeWidth={1.5} aria-hidden />
      <p className="text-white/80 text-sm mb-6 max-w-sm">
        Describe what you&apos;re looking for. We match by meaning, not keywords.
      </p>
      {exampleQueries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {exampleQueries.slice(0, 4).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onExampleClick?.(q)}
              className="px-3 py-1.5 text-[13px] border border-[rgba(51,51,51,0.5)] text-white/80 hover:border-primary/40 hover:text-primary transition-colors duration-150"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
