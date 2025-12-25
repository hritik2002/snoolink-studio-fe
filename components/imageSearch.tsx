"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Search, Loader2, Image as ImageIcon, Video, Clock, Download, Share2, 
  MoreVertical, Sparkles, ChevronDown, ChevronUp, ChevronRight, List as ListIcon, Play, Star, ArrowRight, Filter, Plus, Lightbulb, CloudUpload, Folder
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

// Helper to extract hashtags from description
const extractHashtags = (text: string): string[] => {
  const hashtags: string[] = [];
  // Look for common keywords and convert to hashtags
  const keywords = [
    "landscape", "snow", "mountains", "clouds", "timelapse", "nature", "cold",
    "winter", "outdoor", "scenic", "aerial", "drone", "city", "urban", "people",
    "talking", "conversation", "indoor", "sunset", "sunrise", "ocean", "beach"
  ];
  
  const textLower = text.toLowerCase();
  keywords.forEach(keyword => {
    if (textLower.includes(keyword) && !hashtags.includes(`#${keyword}`)) {
      hashtags.push(`#${keyword}`);
    }
  });
  
  return hashtags.slice(0, 5); // Limit to 5 hashtags
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

  // Trending topics
  const trendingTopics = [
    "Mountain landscapes",
    "Drone footage",
    "City time-lapse",
    "People talking"
  ];

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
      {/* Header with Purple Gradient Background */}
      <div className="sticky top-0 left-0 right-0 z-[200] bg-gradient-to-b from-purple-100 via-purple-50 to-white pt-6 pb-6 px-6 flex-shrink-0">
            {/* Header with Title and Action Buttons */}
            <div className="flex items-start justify-between mb-6">
        <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
                <p className="text-gray-600 text-sm">
                  Find specific moments in your media library instantly.
          </p>
        </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
            </Button>
                <Button size="sm" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                  <CloudUpload className="h-4 w-4" />
                  <span>Upload Media</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full mb-5">
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
            <Sparkles className="h-5 w-5 text-purple-600 mr-4 flex-shrink-0" />
            <Input
              type="text"
              placeholder="snow weather"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 text-lg font-normal !h-auto py-1 px-0 shadow-none rounded-none"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-xl ml-3 flex-shrink-0 transition-colors"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

            {/* Search Mode Buttons */}
            <div className="flex gap-3 mb-5">
              <Button
                variant={mode === "video" ? "default" : "outline"}
                onClick={() => {
                  setMode("video");
                  setImageResults([]);
                  setVideoResults([]);
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={
                  mode === "video"
                    ? "bg-purple-600 hover:bg-purple-700 text-white rounded-full px-5"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-full px-5"
                }
              >
                <Video className="h-4 w-4 mr-2" />
                Search Videos
              </Button>
              <Button
                variant={mode === "image" ? "default" : "outline"}
                onClick={() => {
                  setMode("image");
                  setImageResults([]);
                  setVideoResults([]);
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={
                  mode === "image"
                    ? "bg-purple-600 hover:bg-purple-700 text-white rounded-full px-5"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50 bg-white rounded-full px-5"
                }
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Search Images
              </Button>
      </div>

            {/* Trending Section */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">TRENDING:</span>
            <div className="flex flex-wrap items-center gap-2">
                {trendingTopics.map((topic, idx) => (
                <button
                  key={idx}
                    onClick={() => handleExampleClick(topic)}
                    className="px-4 py-1.5 text-sm bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700 rounded-full transition-all cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>
        </div>
      </div>

      {/* Results Section with Sidebar */}
      <div className="flex gap-6 px-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column - Results */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search Results Header - Sticky */}
        {!isSearching && hasResults && (
            <div className="flex items-center justify-between py-4 bg-white sticky top-0 z-10 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Results</h2>
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                  {mode === "image" ? imageResults.length : videoResults.length}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <span>Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto border-0 bg-transparent text-gray-900 hover:bg-gray-50 rounded-lg gap-1 pl-1 pr-0 h-auto py-0 font-medium">
                    <span>Relevance</span>
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    {mode === "video" && <SelectItem value="confidence">Confidence</SelectItem>}
                {mode === "video" && <SelectItem value="length">Video length</SelectItem>}
                    {mode === "video" && <SelectItem value="timestamp">Timestamp</SelectItem>}
                    {mode === "image" && <SelectItem value="confidence">Confidence</SelectItem>}
              </SelectContent>
            </Select>
              </div>
          </div>
        )}

          {/* Scrollable Results Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pt-4">
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
                    className={`bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all overflow-hidden rounded-2xl ${compactMode ? "p-3" : "p-4"}`}
                >
                    <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} gap-5`}>
                      {/* Thumbnail */}
                      <div className={`relative ${viewMode === "grid" ? "w-full aspect-square" : "w-32 h-32"} flex-shrink-0 rounded-xl overflow-hidden bg-gray-100`}>
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
                    className={`bg-white border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all overflow-hidden relative rounded-2xl ${compactMode ? "p-3" : "p-4"}`}
                  >
                    {/* Three dots menu - top right */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-3 right-3 h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full z-20"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-row"} gap-5`}>
                      {/* Thumbnail */}
                      <div className={`relative ${viewMode === "grid" ? "w-full aspect-video" : "w-[320px] h-[240px]"} flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 group`}>
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
                            {/* Match badge - green pill */}
                            {matchPercentage > 0 && (
                              <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 z-10 pointer-events-none shadow-sm">
                                {matchPercentage}% Match
                              </div>
                            )}
                            {/* Duration badge - bottom right of thumbnail */}
                            {startTime >= 0 && (
                              <div className="absolute bottom-3 right-3 bg-black/75 text-white text-xs font-medium px-2 py-1 rounded-md z-10 pointer-events-none">
                                {formatTime(endTime > 0 ? endTime : startTime)}
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
                      <div className="flex-1 flex flex-col justify-between min-w-0 pr-8">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {sceneSummary}
                          </h3>
                          {!compactMode && (
                            <>
                              <p className={`text-sm text-gray-600 ${isExpanded ? "" : "line-clamp-3"} mb-3 leading-relaxed`}>
                                {result.text}
                              </p>
                              {result.text && result.text.length > 120 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleDescription(result.id);
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-700 mb-3 flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  {isExpanded ? (
                                    <>Show less <ChevronUp className="h-3 w-3" /></>
                                  ) : (
                                    <>Show more <ChevronDown className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                              {/* Hashtags */}
                              {!compactMode && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {extractHashtags(result.text).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 text-xs border border-gray-200 text-gray-600 rounded-full hover:border-gray-300 transition-colors"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                          
                              </div>
                        
                        {/* Duration and Actions - Bottom aligned */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(startTime)}</span>
                            <span className="text-gray-300">-</span>
                            <span>{formatTime(endTime)}</span>
                              </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Add to playlist"
                            >
                              <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              onClick={() => {
                                if (result.videoUrl && startTime >= 0 && endTime > startTime) {
                                  handleDownloadVideo(result.videoUrl, startTime, endTime);
                                }
                              }}
                              disabled={!result.videoUrl || startTime < 0 || endTime <= startTime}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Share"
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
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

            {/* Load More Button */}
            {hasResults && (mode === "video" ? videoResults.length > 0 : imageResults.length > 0) && (
              <div className="py-8 flex justify-center">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-8 py-2 shadow-sm"
                >
                  Load More Results
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Sticky */}
        {hasResults && (
          <div className="w-80 flex-shrink-0 sticky top-0 self-start space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-6">
            {/* Search Insights */}
            <Card className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Search Insights</h3>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Hits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(mode === "image" ? imageResults.length : videoResults.length).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Avg. Conf.</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(avgConfidence)}%</p>
                </div>
              </div>
              
              {/* Dominant Concepts */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Dominant Concepts</p>
                <div className="flex flex-wrap gap-2">
                  {(queryInterpretation.length > 0 ? queryInterpretation.slice(0, 3) : ["Snow", "Nature", "Cold"]).map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            {/* Related Collections */}
            <Card className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Related Collections</h3>
                <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">View all</button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Folder className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Winter B-Roll</span>
                      <p className="text-xs text-gray-500">142 items</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Folder className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">Travel 2023</span>
                      <p className="text-xs text-gray-500">89 items</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Card>

            {/* Refine your search */}
            <Card className="p-4 bg-purple-50 border border-purple-100 rounded-xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 pr-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Refine your search</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Try adding emotional descriptors like &quot;serene&quot; or &quot;dramatic&quot; to filter by mood.
                  </p>
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Learn syntax
                  </button>
                </div>
              </div>
              {/* Moon decoration */}
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-purple-400 rounded-full opacity-80" />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
