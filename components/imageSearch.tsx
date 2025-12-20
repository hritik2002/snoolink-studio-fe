"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, Loader2, Image as ImageIcon, Video, Clock, Download, Share2, 
  MoreVertical, Sparkles, Info, ChevronDown, ChevronUp, Lock, 
  ExternalLink, Grid3x3, List as ListIcon, Play
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

// Helper to extract factual scene label from description (not narration)
const extractSceneSummary = (description: string): string => {
  // Remove age-specific terms and replace with neutral terms
  const cleaned = description
    .replace(/\b(boy|girl|child|kid|teenager|young man|young woman)\b/gi, "person")
    .replace(/\b(man|woman|guy|lady)\b/gi, "person");
  
  // Extract factual elements: subject + action + location
  const patterns = [
    // Pattern: "person [action] [location]"
    /(?:a|an|the)?\s*(person|people|individual)\s+([a-z]+(?:\s+[a-z]+){0,2})\s+(?:in|on|at|inside|within)\s+([a-z]+(?:\s+[a-z]+){0,2})/i,
    // Pattern: "person [action]"
    /(?:a|an|the)?\s*(person|people|individual)\s+([a-z]+(?:\s+[a-z]+){0,2})/i,
    // Pattern: "[object] [action]"
    /(?:a|an|the)?\s*([a-z]+(?:\s+[a-z]+){0,2})\s+(?:using|with|holding|stopping|moving|driving)/i,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const parts = match.slice(1).filter(Boolean);
      if (parts.length >= 2) {
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      }
    }
  }
  
  // Fallback: extract first meaningful phrase
  const firstSentence = cleaned.split(/[.!?]\s+/)[0];
  if (firstSentence.length <= 60) {
    return firstSentence;
  }
  return firstSentence.substring(0, 60) + "...";
};

// Helper to extract match reasons, split into matched vs additional context
const extractMatchReasons = (description: string, query: string): { matched: string[]; additional: string[] } => {
  const matched: string[] = [];
  const additional: string[] = [];
  const queryLower = query.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Check what's in the query
  const queryHasPerson = /(person|people|man|woman|boy|girl|individual)/i.test(query);
  const queryHasPhone = /(phone|mobile|device|smartphone)/i.test(query);
  const queryHasTrain = /(train|railway|subway|metro)/i.test(query);
  const queryHasWalking = /(walking|walk|moving)/i.test(query);
  const queryHasOutdoor = /(outdoor|outside|road|path|street)/i.test(query);
  const queryHasNight = /(night|dark|evening)/i.test(query);
  const queryHasVehicle = /(car|vehicle|truck|bus)/i.test(query);
  
  // Matched reasons (directly related to query)
  if (queryHasPerson && (descLower.includes("person") || descLower.includes("man") || descLower.includes("woman") || descLower.includes("individual"))) {
    matched.push("Person detected");
  }
  if (queryHasPhone && (descLower.includes("phone") || descLower.includes("mobile") || descLower.includes("device"))) {
    matched.push("Phone usage detected");
  }
  if (queryHasTrain && (descLower.includes("train") || descLower.includes("railway") || descLower.includes("subway") || descLower.includes("metro"))) {
    matched.push("Enclosed vehicle environment");
  }
  if (queryHasWalking && (descLower.includes("walking") || descLower.includes("moving"))) {
    matched.push("Walking motion detected");
  }
  if (queryHasOutdoor && (descLower.includes("outdoor") || descLower.includes("outside") || descLower.includes("road") || descLower.includes("path"))) {
    matched.push("Outdoor setting");
  }
  if (queryHasVehicle && (descLower.includes("car") || descLower.includes("vehicle"))) {
    matched.push("Vehicle present");
  }
  
  // Additional context (not in query but detected)
  if (!queryHasNight && (descLower.includes("night") || descLower.includes("dark") || descLower.includes("evening"))) {
    additional.push("Nighttime");
  }
  if (!queryHasOutdoor && (descLower.includes("outdoor") || descLower.includes("outside"))) {
    additional.push("Outdoor setting");
  }
  if (!queryHasPerson && (descLower.includes("person") || descLower.includes("man") || descLower.includes("woman"))) {
    additional.push("Person present");
  }
  
  return {
    matched: matched.slice(0, 3),
    additional: additional.slice(0, 2)
  };
};

// Helper to generate semantic interpretation from query (not echoing raw text)
const generateQueryInterpretation = (query: string): string[] => {
  const queryLower = query.toLowerCase();
  const tokens: string[] = [];
  
  // Extract semantic concepts, not raw words
  if (/(person|people|man|woman|boy|girl|individual)/i.test(query)) {
    tokens.push("Person");
  }
  if (/(phone|mobile|device|smartphone)/i.test(query)) {
    tokens.push("Using phone");
  }
  if (/(train|railway|subway|metro)/i.test(query)) {
    tokens.push("Inside train");
  }
  if (/(walking|walk|moving)/i.test(query)) {
    tokens.push("Walking");
  }
  if (/(outdoor|outside|road|path|street)/i.test(query)) {
    tokens.push("Outdoors");
  }
  if (/(road|path|street)/i.test(query)) {
    tokens.push("Road/path");
  }
  if (/(night|dark|evening)/i.test(query)) {
    tokens.push("Nighttime");
  }
  if (/(car|vehicle|truck|bus)/i.test(query)) {
    tokens.push("Vehicle");
  }
  
  // If no specific tokens found, use generic decomposition
  if (tokens.length === 0) {
    // Try to extract key nouns and verbs
    const words = queryLower.split(/\s+/).filter(w => w.length > 3);
    tokens.push(...words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)));
  }
  
  return tokens.length > 0 ? tokens : ["General search"];
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
  const [queryInterpretation, setQueryInterpretation] = useState<string[]>([]);
  const [timelineHoverTime, setTimelineHoverTime] = useState<{ resultId: string; time: number } | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setQueryInterpretation([]);
    
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
        
        // Generate query interpretation (semantic decomposition)
        const interpretation = generateQueryInterpretation(searchQuery);
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
        
        // Generate query interpretation (semantic decomposition, not echoing raw text)
        const interpretation = generateQueryInterpretation(searchQuery);
        setQueryInterpretation(interpretation);
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
      // Return a new Set to ensure React detects the state change
      return new Set(next);
    });
  }, []);
  
  // Video playback control - play segment from startTime to endTime
  const handleVideoPlay = useCallback((videoElement: HTMLVideoElement, startTime: number, endTime: number) => {
    if (videoElement.currentTime < startTime || videoElement.currentTime > endTime) {
      videoElement.currentTime = startTime;
    }
    videoElement.play();
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
      <div className="sticky top-0 left-0 right-0 z-[200] bg-white py-4 sm:py-6 lg:py-8 flex flex-col gap-4 pb-6 border-b border-gray-200">
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
                setQueryInterpretation([]);
              }}
              disabled={isSearching}
              className={`flex-1 ${
                mode === "image"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
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
                setQueryInterpretation([]);
              }}
              disabled={isSearching}
              className={`flex-1 ${
                mode === "video"
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
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
                ? "Finds images"
                : "Finds short moments inside longer videos"}
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
        {/* Query Interpretation Strip - Structured with Chips */}
        {queryInterpretation && queryInterpretation.length > 0 && hasResults && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex items-center gap-2 flex-wrap">
            <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-700">Interpreted as:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {queryInterpretation.map((token, idx) => (
                <span key={idx} className="inline-flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                    {token}
                  </span>
                  {idx < queryInterpretation.length - 1 && (
                    <span className="text-purple-400">·</span>
                  )}
                </span>
              ))}
            </div>
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
                const matchReasons = result.description ? extractMatchReasons(result.description, searchQuery) : { matched: [], additional: [] };
                
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
                              <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-2"} mb-2 leading-snug`}>
                        {result.description}
                      </p>
                              {result.description && result.description.length > 80 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDescription(result.id);
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-700 mb-2 flex items-center gap-1 cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                              {matchReasons.matched.length > 0 && (
                                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1.5">Why this matched:</p>
                                  <ul className="text-xs text-gray-600 space-y-0.5 mb-2">
                                    {matchReasons.matched.map((reason, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-purple-600">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {matchReasons.additional.length > 0 && (
                                    <>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Additional context detected:</p>
                                      <ul className="text-xs text-gray-500 space-y-0.5">
                                        {matchReasons.additional.map((reason, idx) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <span className="text-gray-400">•</span>
                                            <span>{reason}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
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
              {/* Group results by video URL */}
              {(() => {
                // Group video results by videoUrl
                const groupedResults = videoResults.reduce((acc, result) => {
                  const key = result.videoUrl || result.id;
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(result);
                  return acc;
                }, {} as Record<string, typeof videoResults>);

                return Object.entries(groupedResults).map(([videoUrl, results]) => {
                  // If multiple moments from same video, show grouped header
                  const isGrouped = results.length > 1;
                  const videoName = videoUrl ? videoUrl.split('/').pop()?.split('?')[0] || 'Video' : 'Video';
                  
                  return (
                    <div key={videoUrl || results[0].id} className="space-y-3">
                      {isGrouped && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                          <Video className="h-4 w-4 text-purple-600" />
                          <span>Video: {videoName}</span>
                          <span className="text-xs text-gray-500 font-normal">({results.length} matching moments)</span>
                        </div>
                      )}
                      {results.map((result) => {
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
                      <div className={`relative ${viewMode === "grid" ? "w-full aspect-video" : "w-[400px] h-[360px]"} flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 group`}>
                        {result.videoUrl ? (
                          <>
                            <video
                              src={result.videoUrl}
                              className="w-full h-full object-cover cursor-pointer relative z-0"
                              controls
                              muted
                              playsInline
                              preload="metadata"
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                // Set initial time to startTime
                                if (startTime > 0 && startTime < video.duration) {
                                  video.currentTime = startTime;
                                }
                              }}
                              onPlay={(e) => {
                                const video = e.currentTarget;
                                // Ensure video starts from startTime when play is clicked
                                if (video.currentTime < startTime || video.currentTime > endTime) {
                                  video.currentTime = startTime;
                                }
                                setPlayingVideos(prev => new Set(prev).add(result.id));
                              }}
                              onPause={(e) => {
                                setPlayingVideos(prev => {
                                  const next = new Set(prev);
                                  next.delete(result.id);
                                  return next;
                                });
                              }}
                              onTimeUpdate={(e) => {
                                const video = e.currentTarget;
                                // Loop playback between startTime and endTime
                                if (endTime > startTime && video.currentTime >= endTime) {
                                  video.pause();
                                  video.currentTime = startTime; // Reset to start for replay
                                  setPlayingVideos(prev => {
                                    const next = new Set(prev);
                                    next.delete(result.id);
                                    return next;
                                  });
                                }
                              }}
                              onClick={(e) => {
                                // Only handle clicks on the video itself (not controls)
                                const video = e.currentTarget;
                                const target = e.target as HTMLElement;
                                // Check if click is on video element itself, not controls
                                if (target === video || target.tagName === 'VIDEO') {
                                  if (video.paused) {
                                    video.currentTime = startTime;
                                    video.play().catch((err) => {
                                      console.error("Error playing video:", err);
                                    });
                                  }
                                }
                              }}
                            />
                            {/* Match badge - visible but doesn't block controls */}
                            {matchPercentage > 0 && (
                              <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 group z-10 pointer-events-none">
                                {matchPercentage}% Match
                              </div>
                            )}
                            {/* Timestamp - visible but positioned to avoid controls area */}
                            {endTime > 0 && (
                              <div className="absolute bottom-12 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                                {formatTime(endTime)}
                              </div>
                            )}
                            {/* Play overlay - only appears on hover when paused, below everything */}
                            {!playingVideos.has(result.id) && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-[1] pointer-events-none"
                                style={{ zIndex: 1 }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const video = e.currentTarget.parentElement?.querySelector('video') as HTMLVideoElement;
                                  if (video && video.paused) {
                                    video.currentTime = startTime;
                                    video.play().catch((err) => {
                                      console.error("Error playing video:", err);
                                    });
                                    setPlayingVideos(prev => new Set(prev).add(result.id));
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  const video = e.currentTarget.parentElement?.querySelector('video') as HTMLVideoElement;
                                  // Only enable if video is paused
                                  if (video && video.paused) {
                                    e.currentTarget.style.pointerEvents = 'auto';
                                    e.currentTarget.style.zIndex = '10';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.pointerEvents = 'none';
                                  e.currentTarget.style.zIndex = '10';
                                }}
                              >
                                <div className="bg-purple-600/90 rounded-full p-3 hover:bg-purple-700/90 transition-colors pointer-events-auto">
                                  <Play className="h-6 w-6 text-white fill-white" />
                                </div>
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
                              <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-2"} mb-2 leading-snug`}>
                                {result.text}
                              </p>
                              {result.text && result.text.length > 80 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDescription(result.id);
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-700 mb-2 flex items-center gap-1 cursor-pointer"
                                >
                                  {isExpanded ? (
                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                              {matchReasons.matched.length > 0 && (
                                <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1.5">Why this matched:</p>
                                  <ul className="text-xs text-gray-600 space-y-0.5 mb-2">
                                    {matchReasons.matched.map((reason, idx) => (
                                      <li key={idx} className="flex items-start gap-1">
                                        <span className="text-purple-600">•</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {matchReasons.additional.length > 0 && (
                                    <>
                                      <p className="text-xs font-medium text-gray-600 mb-1">Additional context detected:</p>
                                      <ul className="text-xs text-gray-500 space-y-0.5">
                                        {matchReasons.additional.map((reason, idx) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <span className="text-gray-400">•</span>
                                            <span>{reason}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Interactive Timeline Bar */}
                          {videoDuration > 0 && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                                <span className="text-gray-400">of {formatTime(videoDuration)}</span>
                              </div>
                              <div 
                                className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative cursor-pointer group"
                                onMouseMove={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const percent = (x / rect.width) * 100;
                                  const hoverTime = (percent / 100) * videoDuration;
                                  setTimelineHoverTime({ resultId: result.id, time: hoverTime });
                                }}
                                onMouseLeave={() => setTimelineHoverTime(null)}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const percent = (x / rect.width) * 100;
                                  const clickTime = (percent / 100) * videoDuration;
                                  // Jump to that time in the video
                                  const videoElement = e.currentTarget.closest('.relative')?.querySelector('video') as HTMLVideoElement;
                                  if (videoElement) {
                                    videoElement.currentTime = Math.max(0, Math.min(clickTime, videoDuration));
                                  }
                                }}
                                title={`Moment occurs at ${formatTime(startTime)}–${formatTime(endTime)} of video`}
                              >
                                <div 
                                  className="h-full bg-purple-600 transition-all"
                                  style={{ 
                                    width: `${(duration / videoDuration) * 100}%`,
                                    marginLeft: `${positionPercent}%`
                                  }}
                                />
                                {timelineHoverTime?.resultId === result.id && (
                                  <div 
                                    className="absolute top-0 h-full w-0.5 bg-purple-400 opacity-50"
                                    style={{ left: `${(timelineHoverTime.time / videoDuration) * 100}%` }}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {/* Primary Action - Play/View Full Video */}
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                              onClick={() => {
                                if (result.videoUrl) {
                                  window.open(result.videoUrl, "_blank");
                                }
                              }}
                            >
                              <Video className="h-3.5 w-3.5 mr-1.5" />
                              View full video
                            </Button>
                            {/* Secondary Actions - Text buttons */}
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
                          {/* Tertiary Actions - Menu */}
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
                  );
                });
              })()}
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
