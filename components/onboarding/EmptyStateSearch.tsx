"use client";

import { CloudUpload, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/lib/app-nav";
import { appBtnPrimary, appChip } from "@/lib/app-classes";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-20 animate-app-fade-up">
        <div className="w-14 h-14 rounded-[10px] bg-app-active flex items-center justify-center mb-5">
          <CloudUpload className="w-6 h-6 text-app-4" />
        </div>
        <div className="text-center max-w-[360px] space-y-2 mb-6">
          <p className="text-[16px] font-semibold text-app-1">No media yet</p>
          <p className="text-[14px] text-app-3 leading-relaxed">
            Upload files to index them, then search by meaning — not keywords.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(APP_ROUTES.uploads)}
          className={appBtnPrimary}
        >
          <CloudUpload className="w-4 h-4" />
          Upload media
        </button>
      </div>
    );
  }

  if (!searchQuery?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 animate-app-fade-up">
        <div className="w-14 h-14 rounded-[10px] bg-app-active flex items-center justify-center mb-5">
          <Search className="w-6 h-6 text-app-4" />
        </div>
        <p className="text-[16px] font-semibold text-app-1 mb-2">Search your library</p>
        <p className="text-[14px] text-app-3 text-center max-w-md mb-8">
          Describe what you&apos;re looking for in plain language.
        </p>
        {exampleQueries.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {exampleQueries.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onExampleClick?.(q)}
                className={cn(appChip, "hover:border-app-3")}
              >
                <Sparkles className="w-3.5 h-3.5 text-app-4" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 animate-app-fade-up">
      <p className="text-[16px] font-semibold text-app-1 mb-2">No results</p>
      <p className="text-[14px] text-app-3 text-center max-w-md">
        Try broader terms or upload more media to expand your library.
      </p>
    </div>
  );
}
