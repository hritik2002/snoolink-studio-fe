"use client";

import { CloudUpload, Sparkles, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/contexts/OnboardingContext";

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
  exampleQueries = []
}: EmptyStateSearchProps) {
  const router = useRouter();
  const { onboardingState } = useOnboarding();

  console.log("hasContent", hasContent);

  // If user has no content, guide them to upload
  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Card className="max-w-md w-full p-8 beetle-card backdrop-blur-3xl border-primary/20 relative">
          <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
          <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-br" aria-hidden />
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CloudUpload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">
              You haven't uploaded any media yet
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Upload your first image or video to start searching by meaning. Our AI will automatically index your media, making it searchable instantly.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CloudUpload className="h-4 w-4 text-primary" />
              </div>
              <span>Upload your media</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <span>We index it with AI</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <span>Search by meaning, not keywords</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/?view=uploads")}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white"
            size="lg"
          >
            <CloudUpload className="h-4 w-4 mr-2" />
            Upload Your First Media
          </Button>
        </Card>
      </div>
    );
  }

  // If user has content but no search query or no results
  return (
    <div className="text-center text-muted-foreground py-12 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Search className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mb-1 font-medium text-foreground/80 text-lg">Search your media by meaning</p>
      <p className="mb-6 text-sm text-muted-foreground max-w-md mx-auto">
        Type what you're looking for - we'll find it by meaning, not just keywords. Try searching for concepts like "person walking" or "outdoor scene".
      </p>
      
      {exampleQueries.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {exampleQueries.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onExampleClick?.(q)}
              className="px-4 py-2 text-sm bg-card border border-border hover:border-primary/30 hover:bg-primary/5 rounded-full text-foreground/80 transition-colors flex items-center gap-2"
            >
              <Search className="h-3.5 w-3.5" />
              {q}
            </button>
          ))}
        </div>
      )}

      {searchQuery && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">No results found for "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground">Try broader terms or a different query</p>
        </div>
      )}
    </div>
  );
}
