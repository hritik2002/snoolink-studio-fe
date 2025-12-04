"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";

interface SearchResult {
  id: string;
  imageUrl: string;
  description?: string;
  score?: number;
}

export default function ImageSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/images/search?query=${searchQuery}`, {
        method: "GET",
      });

      const data = await response.json();


      const results = data.data.map(
        (result: {
          id: string;
          text: string;
          score: number;
          imageUrl: string;
        }) => ({
          id: result.id,
          imageUrl: result.imageUrl,
          description: result.text,
          score: result.score,
        })
      );

      console.log("Search results:", results);

      setSearchResults(results);
    } catch (error) {
      console.error("Error searching:", error);
      alert("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-3xl mx-auto relative">
      <div className="sticky top-0 left-0 right-0 z-10 bg-[var(--background-secondary)] py-8 flex flex-col gap-4">
        <div className="">
          <h1 className="text-3xl font-light text-white mb-2">Search</h1>
          <p className="text-white/60 text-sm">
            Search images semantically using text
          </p>
        </div>
        <div className="relative w-full">
          <div className="relative flex items-center bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-4 shadow-lg">
            {/* Search Input */}
            <Input
              type="text"
              placeholder="Search images semantically..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
            />

            {/* Right side search button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10 ml-4"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-8">
        {/* Search Results */}
        {isSearching ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          searchResults.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-xl font-light text-white/80 mb-6">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} found
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {searchResults.map((result) => (
                <Card
                  key={result.id}
                  className="bg-[#1a1a1a] border-white/10 overflow-hidden hover:border-white/20 transition-colors"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={result.imageUrl}
                      alt={result.description || "Search result"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {result.description && (
                    <div className="p-3">
                      <p className="text-sm text-white/60 line-clamp-2">
                        {result.description}
                      </p>
                      {result.score && (
                        <p className="text-xs text-white/40 mt-1">
                          Score: {result.score.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 mt-12">
              <p>No results found. Try a different search query.</p>
            </div>
          ))}
      </div>
    </div>
  );
}
