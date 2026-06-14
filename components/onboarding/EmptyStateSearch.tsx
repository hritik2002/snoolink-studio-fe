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
        <div className="glue-card max-w-sm w-full p-8 relative backdrop-blur-3xl">
          <div className="text-center space-y-4">
            <CloudUpload className="h-8 w-8 text-primary mx-auto" strokeWidth={1.5} aria-hidden />
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">No media yet</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[28ch] mx-auto">
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
        <Search className="h-6 w-6 text-muted-foreground mb-4" strokeWidth={1.5} aria-hidden />
        <p className="text-foreground/80 text-sm mb-1">No results for &ldquo;{searchQuery}&rdquo;</p>
        <p className="text-[13px] text-muted-foreground">Try broader terms or a different query.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
      <Search className="h-6 w-6 text-muted-foreground mb-4" strokeWidth={1.5} aria-hidden />
      <p className="text-foreground/80 text-sm mb-6 max-w-sm">
        Describe what you&apos;re looking for. We match by meaning, not keywords.
      </p>
      {exampleQueries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {exampleQueries.slice(0, 4).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onExampleClick?.(q)}
              className="px-3 py-1.5 text-[13px] border border-border text-foreground/80 hover:border-primary/40 hover:text-primary transition-colors duration-150"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
