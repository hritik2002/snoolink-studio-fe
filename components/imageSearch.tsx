"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";

type SearchMode = "image" | "video";

interface ImageSearchResult {
  id: string;
  imageUrl: string;
  description?: string;
  score?: number;
}

interface VideoSearchResult {
  id: string;
  text: string;
  videoUrl?: string;
  startTime?: string;
  endTime?: string;
  score?: number;
}

export default function ImageSearch() {
  const [mode, setMode] = useState<SearchMode>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      if (mode === "image") {
        const response = await fetch(`/api/images/search?query=${encodeURIComponent(searchQuery)}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Search failed");
        }

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

        setImageResults(results);
        setVideoResults([]);

        toast({
          title: "Search completed",
          description: `Found ${results.length} result${results.length !== 1 ? "s" : ""} for "${searchQuery}"`,
          variant: "success",
        });
      } else {
        const response = await fetch(`/api/videos/search?query=${encodeURIComponent(searchQuery)}`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Search failed");
        }

        const data = await response.json();

        const results = data.data.map(
          (result: {
            id: string;
            text: string;
            videoUrl?: string;
            startTime?: string;
            endTime?: string;
            score: number;
          }) => ({
            id: result.id,
            text: result.text,
            videoUrl: result.videoUrl,
            startTime: result.startTime,
            endTime: result.endTime,
            score: result.score,
          })
        );

        setVideoResults(results);
        setImageResults([]);

        toast({
          title: "Search completed",
          description: `Found ${results.length} video clip${results.length !== 1 ? "s" : ""} for "${searchQuery}"`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, mode, toast]);

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
            Search {mode === "image" ? "images" : "videos"} semantically using text
          </p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "image" ? "default" : "outline"}
            onClick={() => {
              setMode("image");
              setImageResults([]);
              setVideoResults([]);
            }}
            disabled={isSearching}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image Search
          </Button>
          <Button
            variant={mode === "video" ? "default" : "outline"}
            onClick={() => {
              setMode("video");
              setImageResults([]);
              setVideoResults([]);
            }}
            disabled={isSearching}
            className="flex-1"
          >
            <Video className="h-4 w-4 mr-2" />
            Video Search
          </Button>
        </div>
        <div className="relative w-full">
          <div className="relative flex items-center bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-4 shadow-lg">
            {/* Search Input */}
            <Input
              type="text"
              placeholder={mode === "image" ? "Search images semantically..." : "Search videos semantically..."}
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
        ) : mode === "image" ? (
          imageResults.length > 0 ? (
            <div className="mt-12">
              <h2 className="text-xl font-light text-white/80 mb-6">
                {imageResults.length} result
                {imageResults.length !== 1 ? "s" : ""} found
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imageResults.map((result) => (
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
          )
        ) : (
          videoResults.length > 0 ? (
            <div className="mt-12">
              <h2 className="text-xl font-light text-white/80 mb-6">
                {videoResults.length} video clip
                {videoResults.length !== 1 ? "s" : ""} found
              </h2>
              <div className="space-y-4">
                {videoResults.map((result) => (
                  <Card
                    key={result.id}
                    className="bg-[#1a1a1a] border-white/10 p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="space-y-2">
                      {result.videoUrl && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                          <video
                            src={result.videoUrl}
                            controls
                            className="w-full h-full object-contain"
                            onLoadedMetadata={(e) => {
                              const video = e.currentTarget;
                              const startTime = result.startTime
                                ? parseFloat(result.startTime)
                                : 0;
                              video.currentTime = startTime;
                            }}
                            onTimeUpdate={(e) => {
                              const video = e.currentTarget;
                              const endTime = result.endTime
                                ? parseFloat(result.endTime)
                                : video.duration;
                              
                              // Pause video when it reaches endTime
                              if (video.currentTime >= endTime) {
                                video.pause();
                                // Seek back to startTime for looping or replay
                                const startTime = result.startTime
                                  ? parseFloat(result.startTime)
                                  : 0;
                                video.currentTime = startTime;
                              }
                            }}
                            onPlay={(e) => {
                              const video = e.currentTarget;
                              const startTime = result.startTime
                                ? parseFloat(result.startTime)
                                : 0;
                              // Ensure video starts from startTime when played
                              if (video.currentTime < startTime) {
                                video.currentTime = startTime;
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-sm text-white/80 line-clamp-3">
                          {result.text}
                        </p>
                        {(result.startTime || result.endTime) && (
                          <p className="text-xs text-white/40">
                            Time: {result.startTime}s - {result.endTime}s
                          </p>
                        )}
                        {result.score && (
                          <p className="text-xs text-white/40">
                            Score: {result.score.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-white/40 mt-12">
              <p>No results found. Try a different search query.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
