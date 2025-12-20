"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, Loader2, Image as ImageIcon, Video, Clock, Download, Share2, 
  MoreVertical, Sparkles, Info, ChevronDown, ChevronUp, Lock, 
  ExternalLink, Grid3x3, List as ListIcon
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type SearchMode = "image" | "video";
type ViewMode = "grid" | "list";
type CompactMode = boolean;

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
  videoDuration?: number; // Full video duration for timeline
}

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

// Helper to extract scene summary from description (first sentence or key phrase)
const extractSceneSummary = (description: string): string => {
  // Try to extract a concise scene description
  const sentences = description.split(/[.!?]\s+/);
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    // If first sentence is too long, try to find key phrases
    if (firstSentence.length > 80) {
      // Look for patterns like "person walking", "car stopping", etc.
      const patterns = [
        /(?:a|an|the)?\s*([a-z]+(?:\s+[a-z]+){0,3})\s+(?:walking|running|standing|sitting|driving|stopping|moving)/i,
        /(?:shows|features|displays|presents)\s+([a-z]+(?:\s+[a-z]+){0,4})/i,
      ];
      for (const pattern of patterns) {
        const match = description.match(pattern);
        if (match && match[1]) {
          return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
      return firstSentence.substring(0, 60) + "...";
    }
    return firstSentence;
  }
  return description.substring(0, 60) + "...";
};

// Helper to extract "Why this matched" reasons from description
const extractMatchReasons = (description: string, query: string): string[] => {
  const reasons: string[] = [];
  const queryLower = query.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Extract key concepts
  if (descLower.includes("person") || descLower.includes("man") || descLower.includes("woman")) {
    reasons.push("Detected person");
  }
  if (descLower.includes("walking") || descLower.includes("moving")) {
    reasons.push("Walking motion detected");
  }
  if (descLower.includes("outdoor") || descLower.includes("outside") || descLower.includes("road") || descLower.includes("path")) {
    reasons.push("Outdoor setting");
  }
  if (descLower.includes("night") || descLower.includes("dark")) {
    reasons.push("Nighttime scene");
  }
  if (descLower.includes("car") || descLower.includes("vehicle")) {
    reasons.push("Vehicle present");
  }
  
  return reasons.slice(0, 3); // Max 3 reasons
};

// Example query chips
const EXAMPLE_QUERIES = [
  "Person walking on road",
  "Crowd cheering in stadium",
  "Car stopping at traffic light",
];

export default function ImageSearch() {
  const [mode, setMode] = useState<SearchMode>("video");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [compactMode, setCompactMode] = useState<CompactMode>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [queryInterpretation, setQueryInterpretation] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setQueryInterpretation(null);
    
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
        
        // Generate query interpretation
        const interpretation = `Image search: ${searchQuery.toLowerCase()}`;
        setQueryInterpretation(interpretation);
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
        
        // Generate query interpretation (simplified - in real app, this would come from backend)
        const queryLower = searchQuery.toLowerCase();
        const interpretations: string[] = [];
        if (queryLower.includes("person") || queryLower.includes("man") || queryLower.includes("woman")) {
          interpretations.push("person");
        }
        if (queryLower.includes("walking") || queryLower.includes("walk")) {
          interpretations.push("walking");
        }
        if (queryLower.includes("outdoor") || queryLower.includes("outside") || queryLower.includes("road") || queryLower.includes("path")) {
          interpretations.push("outdoors");
        }
        if (queryLower.includes("road") || queryLower.includes("path")) {
          interpretations.push("road/path");
        }
        if (queryLower.includes("night") || queryLower.includes("dark")) {
          interpretations.push("nighttime");
        }
        
        setQueryInterpretation(interpretations.length > 0 ? interpretations.join(" → ") : searchQuery);
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

  const handleExampleClick = useCallback((example: string) => {
    setSearchQuery(example);
  }, []);

  const toggleDescription = useCallback((resultId: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  }, []);

  const handleDownloadImage = useCallback(
    async (imageUrl: string, description?: string) => {
      try {
        const loadingToast = toast({
          title: "Preparing download",
          description: "Fetching image...",
          variant: "default",
        });

        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch image");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
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

        const loadingToast = toast({
          title: "Preparing download",
          description: "Extracting video segment...",
          variant: "default",
        });

        const downloadUrl = new URL(`${backendUrl}/api/media/download-video-segment`);
        downloadUrl.searchParams.append("videoUrl", videoUrl);
        downloadUrl.searchParams.append("startTime", startTime.toString());
        downloadUrl.searchParams.append("endTime", endTime.toString());

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

        const blob = await response.blob();
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

  // Calculate average confidence
  const avgConfidence = 
    (mode === "image" ? imageResults : videoResults)
      .reduce((sum, r) => sum + (r.score ? getMatchPercentage(r.score) : 0), 0) /
    Math.max((mode === "image" ? imageResults : videoResults).length, 1);

  const hasResults = (mode === "image" ? imageResults.length : videoResults.length) > 0;

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto relative">
      <div className="sticky top-0 left-0 right-0 z-10 bg-white py-4 sm:py-6 lg:py-8 flex flex-col gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {mode === "image" 
              ? "Search images semantically using text"
              : "Search moments inside videos using natural language"}
          </p>
        </div>
        
        {/* Mode Toggle with Helper Text */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant={mode === "image" ? "default" : "outline"}
              onClick={() => {
                setMode("image");
                setImageResults([]);
                setVideoResults([]);
                setQueryInterpretation(null);
              }}
              disabled={isSearching}
              className={`flex-1 ${
                mode === "image"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              <span>Image Search</span>
            </Button>
            <Button
              variant={mode === "video" ? "default" : "outline"}
              onClick={() => {
                setMode("video");
                setImageResults([]);
                setVideoResults([]);
                setQueryInterpretation(null);
              }}
              disabled={isSearching}
              className={`flex-1 ${
                mode === "video"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Video className="h-4 w-4 mr-2" />
              <span>Video Search</span>
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3 w-3" />
            <span>
              {mode === "image" 
                ? "Currently searching images"
                : "Currently searching video moments"}
            </span>
          </div>
        </div>

        {/* Search Input with Example Chips */}
        <div className="space-y-3">
          <div className="relative w-full">
            <div className="relative flex items-center bg-white border border-gray-300 rounded-xl px-3 sm:px-4 py-3 sm:py-4 shadow-sm hover:border-purple-400 transition-colors">
              <Input
                type="text"
                placeholder="Describe a scene, action, or moment (e.g. 'man walking on road at night')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-lg"
              />
              <div className="flex items-center gap-2 ml-2 sm:ml-4">
                <div className="group relative">
                  <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  <div className="absolute right-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    You can describe actions, objects, environment, and time
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
          
          {/* Example Query Chips */}
          {!hasResults && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Try:</span>
              {EXAMPLE_QUERIES.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors cursor-pointer"
                >
                  {example}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-4 pt-4">
        {/* Query Interpretation Strip */}
        {queryInterpretation && hasResults && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              <span className="font-medium">Interpreted as:</span>{" "}
              <span className="text-purple-700">{queryInterpretation}</span>
            </span>
          </div>
        )}

        {/* Search Results Header */}
        {!isSearching && hasResults && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h2 className="text-lg sm:text-xl font-medium text-gray-900">
                {mode === "image" 
                  ? `${imageResults.length} matching image${imageResults.length !== 1 ? "s" : ""} found`
                  : `${videoResults.length} matching moment${videoResults.length !== 1 ? "s" : ""} found`}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="border-gray-300"
                >
                  {viewMode === "grid" ? (
                    <><ListIcon className="h-4 w-4 mr-2" />List</>
                  ) : (
                    <><Grid3x3 className="h-4 w-4 mr-2" />Grid</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompactMode(!compactMode)}
                  className="border-gray-300"
                >
                  {compactMode ? "Expanded" : "Compact"}
                </Button>
              </div>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px] border-gray-300 bg-white text-gray-700">
                <span>Sort by: {sortBy === "relevance" ? "Relevance (semantic similarity)" : sortBy === "confidence" ? "Confidence (model score)" : sortBy === "length" ? "Video length" : "Timestamp order"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance (semantic similarity)</SelectItem>
                {mode === "video" && <SelectItem value="confidence">Confidence (model score)</SelectItem>}
                {mode === "video" && <SelectItem value="length">Video length</SelectItem>}
                {mode === "video" && <SelectItem value="timestamp">Timestamp order</SelectItem>}
                {mode === "image" && <SelectItem value="confidence">Confidence (model score)</SelectItem>}
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
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
              {imageResults.map((result) => {
                const matchPercentage = result.score ? getMatchPercentage(result.score) : 0;
                const sceneSummary = result.description ? extractSceneSummary(result.description) : "Image";
                const isExpanded = expandedDescriptions.has(result.id);
                const matchReasons = result.description ? extractMatchReasons(result.description, searchQuery) : [];
                
                return (
                  <Card
                    key={result.id}
                    className={`bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all overflow-hidden ${compactMode ? "p-3" : "p-4"}`}
                  >
                    <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} gap-4`}>
                      {/* Thumbnail */}
                      <div className={`relative ${viewMode === "grid" ? "w-full aspect-square" : "w-32 h-32"} flex-shrink-0 rounded-lg overflow-hidden bg-gray-100`}>
                        {viewMode === "list" ? (
                          <Image
                            src={result.imageUrl}
                            alt={sceneSummary}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Image
                            src={result.imageUrl}
                            alt={sceneSummary}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        )}
                        {matchPercentage > 0 && (
                          <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 group">
                            {matchPercentage}% Match
                            <div className="absolute left-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              Semantic similarity score between your query and this image
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                            {sceneSummary}
                          </h3>
                          {!compactMode && (
                            <>
                              <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-2"} mb-2`}>
                                {result.description}
                              </p>
                              {result.description && result.description.length > 100 && (
                                <button
                                  onClick={() => toggleDescription(result.id)}
                                  className="text-xs text-purple-600 hover:text-purple-700 mb-2 flex items-center gap-1 cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                              {matchReasons.length > 0 && (
                                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Why this matched:</p>
                                  <ul className="text-xs text-gray-600 space-y-0.5">
                                    {matchReasons.map((reason, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-purple-600">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                              onClick={() => handleDownloadImage(result.imageUrl, result.description)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                            >
                              <Share2 className="h-3.5 w-3.5 mr-1.5" />
                              Share
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No results found. Try a different search query.</p>
            </div>
          )
        ) : (
          videoResults.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
              {videoResults.map((result) => {
                const matchPercentage = result.score ? getMatchPercentage(result.score) : 0;
                const sceneSummary = extractSceneSummary(result.text);
                const startTime = result.startTime ? parseFloat(result.startTime) : 0;
                const endTime = result.endTime ? parseFloat(result.endTime) : 0;
                const duration = endTime - startTime;
                const isExpanded = expandedDescriptions.has(result.id);
                const matchReasons = extractMatchReasons(result.text, searchQuery);
                const videoDuration = result.videoDuration || endTime; // Fallback to endTime if duration not available
                const positionPercent = videoDuration > 0 ? (startTime / videoDuration) * 100 : 0;
                
                return (
                  <Card
                    key={result.id}
                    className={`bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all overflow-hidden ${compactMode ? "p-3" : "p-4"}`}
                  >
                    <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} gap-4`}>
                      {/* Thumbnail */}
                      <div className={`relative ${viewMode === "grid" ? "w-full aspect-video" : "w-48 h-32"} flex-shrink-0 rounded-lg overflow-hidden bg-gray-100`}>
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
                            {matchPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 group">
                                {matchPercentage}% Match
                                <div className="absolute left-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                  Semantic similarity score between your query and this moment
                                </div>
                              </div>
                            )}
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
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                            {sceneSummary}
                          </h3>
                          {!compactMode && (
                            <>
                              <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-2"} mb-2`}>
                                {result.text}
                              </p>
                              {result.text && result.text.length > 100 && (
                                <button
                                  onClick={() => toggleDescription(result.id)}
                                  className="text-xs text-purple-600 hover:text-purple-700 mb-2 flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                              {matchReasons.length > 0 && (
                                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Why this matched:</p>
                                  <ul className="text-xs text-gray-600 space-y-0.5">
                                    {matchReasons.map((reason, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-purple-600">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Timeline Bar */}
                          {videoDuration > 0 && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                                <span className="text-gray-400">of {formatTime(videoDuration)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-600"
                                  style={{ 
                                    width: `${(duration / videoDuration) * 100}%`,
                                    marginLeft: `${positionPercent}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                              onClick={() => {
                                if (result.videoUrl) {
                                  window.open(result.videoUrl, "_blank");
                                }
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Full video
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                              onClick={() => {
                                if (result.videoUrl && startTime >= 0 && endTime > startTime) {
                                  handleDownloadVideo(result.videoUrl, startTime, endTime);
                                }
                              }}
                              disabled={!result.videoUrl || startTime < 0 || endTime <= startTime}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                            >
                              <Share2 className="h-3.5 w-3.5 mr-1.5" />
                              Share
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No results found. Try a different search query.</p>
            </div>
          )
        )}

        {/* AI Confidence Footer */}
        {hasResults && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Search powered by multimodal embeddings · Avg confidence: {Math.round(avgConfidence)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
