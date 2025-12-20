"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Image as ImageIcon, Video, Clock, List, Download, Share2, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

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

// Helper function to extract tags from description
const extractTags = (description: string): string[] => {
  const commonWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "this", "that", "these", "those", "it", "its", "they", "them", "their", "there", "then", "than"
  ]);
  
  const words = description
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Get unique words and return top 3-5 as tags
  const uniqueWords = Array.from(new Set(words));
  return uniqueWords.slice(0, 5).map(word => `#${word}`);
};

// Helper function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Helper function to get match percentage from score
const getMatchPercentage = (score: number): number => {
  return Math.round(score * 100);
};

export default function ImageSearch() {
  const [mode, setMode] = useState<SearchMode>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
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

  const handleDownloadImage = useCallback(
    async (imageUrl: string, description?: string) => {
      try {
        // Show loading toast
        const loadingToast = toast({
          title: "Preparing download",
          description: "Fetching image...",
          variant: "default",
        });

        // Fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }

        // Get the blob from response
        const blob = await response.blob();

        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Extract file extension from URL or use default
        const urlPath = new URL(imageUrl).pathname;
        const extension = urlPath.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[0] || ".jpg";
        const filename = description
          ? `${description.substring(0, 50).replace(/[^a-z0-9]/gi, "_")}${extension}`
          : `image-${Date.now()}${extension}`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        loadingToast.dismiss();
        toast({
          title: "Download started",
          description: "Image is being downloaded",
          variant: "success",
        });
      } catch (error) {
        console.error("Error downloading image:", error);
        toast({
          title: "Download failed",
          description: error instanceof Error ? error.message : "Failed to download image",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleDownloadVideo = useCallback(
    async (videoUrl: string, startTime: number, endTime: number) => {
      try {
        // Get auth token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
          toast({
            title: "Authentication required",
            description: "Please log in to download videos",
            variant: "destructive",
          });
          return;
        }

        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        // Show loading toast
        const loadingToast = toast({
          title: "Preparing download",
          description: "Extracting video segment...",
          variant: "default",
        });

        // Create download URL with query parameters
        const downloadUrl = new URL(`${backendUrl}/api/media/download-video-segment`);
        downloadUrl.searchParams.append("videoUrl", videoUrl);
        downloadUrl.searchParams.append("startTime", startTime.toString());
        downloadUrl.searchParams.append("endTime", endTime.toString());

        // Fetch the video segment
        const response = await fetch(downloadUrl.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to download video segment");
        }

        // Get the blob from response
        const blob = await response.blob();

        // Create a download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `video-segment-${startTime.toFixed(2)}-${endTime.toFixed(2)}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        loadingToast.dismiss();
        toast({
          title: "Download started",
          description: "Video segment is being downloaded",
          variant: "success",
        });
      } catch (error) {
        console.error("Error downloading video segment:", error);
        toast({
          title: "Download failed",
          description: error instanceof Error ? error.message : "Failed to download video segment",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto relative">
      <div className="sticky top-0 left-0 right-0 z-10 bg-white py-4 sm:py-6 lg:py-8 flex flex-col gap-4 pb-6">
        <div className="">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600 text-sm sm:text-base">
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
            className={`flex-1 ${
              mode === "image"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Image </span>Search
          </Button>
          <Button
            variant={mode === "video" ? "default" : "outline"}
            onClick={() => {
              setMode("video");
              setImageResults([]);
              setVideoResults([]);
            }}
            disabled={isSearching}
            className={`flex-1 ${
              mode === "video"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Video className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Video </span>Search
          </Button>
        </div>
        <div className="relative w-full">
          <div className="relative flex items-center bg-white border border-gray-300 rounded-xl px-3 sm:px-4 py-3 sm:py-4 shadow-sm hover:border-purple-400 transition-colors">
            {/* Search Input */}
            <Input
              type="text"
              placeholder={mode === "image" ? "Search images semantically..." : "Search videos semantically..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-lg"
            />

            {/* Right side search button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ml-2 sm:ml-4"
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

      <div className="w-full space-y-6">
        {/* Search Results Header */}
        {!isSearching && ((mode === "image" && imageResults.length > 0) || (mode === "video" && videoResults.length > 0)) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4">
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 flex items-center gap-2">
              Results{" "}
              <span className="bg-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                {mode === "image" ? imageResults.length : videoResults.length}
              </span>
            </h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] border-gray-300 bg-white text-gray-700">
                <span>Sort by: {sortBy === "relevance" ? "Relevance" : sortBy === "date" ? "Date" : "Score"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Results */}
        {isSearching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : mode === "image" ? (
          imageResults.length > 0 ? (
            <div className="space-y-4">
              {imageResults.map((result) => {
                const matchPercentage = result.score ? getMatchPercentage(result.score) : 0;
                const tags = result.description ? extractTags(result.description) : [];
                
                return (
                  <Card
                    key={result.id}
                    className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-48 h-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={result.imageUrl}
                          alt={result.description || "Search result"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {/* Match Badge */}
                        {matchPercentage > 0 && (
                          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                            {matchPercentage}% Match
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                                {result.description?.substring(0, 50) || "Image Result"}
                              </h3>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {result.description}
                            </p>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs text-gray-500 hover:text-purple-600 cursor-pointer transition-colors">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span className="text-xs text-gray-500">Image</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                  <List className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    if (result.imageUrl) {
                                      handleDownloadImage(result.imageUrl, result.description);
                                    } else {
                                      toast({
                                        title: "Cannot download",
                                        description: "Image URL is missing",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={!result.imageUrl}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {/* Load More Results Button for Images */}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="bg-transparent border-white/10 text-white hover:bg-white/10"
                >
                  Load More Results
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No results found. Try a different search query.</p>
            </div>
          )
        ) : (
          videoResults.length > 0 ? (
            <div className="space-y-4">
              {videoResults.map((result) => {
                const matchPercentage = result.score ? getMatchPercentage(result.score) : 0;
                const tags = result.text ? extractTags(result.text) : [];
                const startTime = result.startTime ? parseFloat(result.startTime) : 0;
                const endTime = result.endTime ? parseFloat(result.endTime) : 0;
                
                return (
                  <Card
                    key={result.id}
                    className="bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-48 h-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {result.videoUrl ? (
                          <>
                            <video
                              src={result.videoUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                if (startTime > 0) {
                                  video.currentTime = startTime;
                                }
                              }}
                            />
                            {/* Match Badge */}
                            {matchPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                                {matchPercentage}% Match
                              </div>
                            )}
                            {/* Timestamp */}
                            {endTime > 0 && (
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                {formatTime(endTime)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">
                                {result.text?.substring(0, 50) || "Video Clip"}
                              </h3>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                              {result.text}
                            </p>
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs text-gray-500 hover:text-purple-600 cursor-pointer transition-colors">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                              {(startTime > 0 || endTime > 0) && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-purple-500" />
                                  <span className="text-xs text-gray-500">
                                    {formatTime(startTime)} - {formatTime(endTime)}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                  <List className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    if (result.videoUrl && startTime >= 0 && endTime > startTime) {
                                      handleDownloadVideo(result.videoUrl, startTime, endTime);
                                    } else {
                                      toast({
                                        title: "Cannot download",
                                        description: "Video URL or time range is missing",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  disabled={!result.videoUrl || startTime < 0 || endTime <= startTime}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {/* Load More Results Button */}
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Load More Results
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No results found. Try a different search query.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
