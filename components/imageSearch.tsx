"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search, Loader2, Image as ImageIcon, Video, Clock, Download, Share2,
  MoreVertical, Sparkles, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, List as ListIcon, Play, Star, ArrowRight, Plus, Lightbulb, CloudUpload, Folder
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { SearchResultsSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateSearch } from "@/components/onboarding/EmptyStateSearch";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

type SearchMode = "image" | "video";
type ViewMode = "grid" | "list";
type CompactMode = boolean;

interface ImageSearchResult {
  id: string;
  imageUrl: string;
  score?: number;
}

interface VideoClip {
  id: string;
  score: number;
  startTime: string;
  endTime: string;
}

interface VideoSearchResult {
  videoUrl: string;
  videoId?: number;
  title?: string;
  duration?: number;
  resolution?: string;
  collectionName?: string;
  clips: VideoClip[];
  bestScore: number;
}

// Results are now an object with videoUrl as keys
type VideoSearchResults = Record<string, VideoSearchResult>;

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

interface CollectionOption {
  name: string;
  count: number;
}

export default function ImageSearch() {
  const [mode, setMode] = useState<SearchMode>("video");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageResults, setImageResults] = useState<ImageSearchResult[]>([]);
  const [videoResults, setVideoResults] = useState<VideoSearchResults>({});
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [compactMode, setCompactMode] = useState<CompactMode>(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [queryInterpretation, setQueryInterpretation] = useState<string[]>([]);
  const [timelineHoverTime, setTimelineHoverTime] = useState<{ resultId: string; time: number } | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [selectedClips, setSelectedClips] = useState<Record<string, string>>({}); // videoUrl -> clipId
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const clipEndTimes = useRef<Record<string, number>>({}); // videoUrl -> endTime
  const { toast } = useToast();
  const router = useRouter();
  const { refreshState: refreshOnboardingState, onboardingState } = useOnboarding();

  // Collection selection state
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(["all"]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const collectionScrollRef = useRef<HTMLDivElement>(null);

  // Expand query: when true, backend expands the search query with AI (e.g. "water" → "water, liquid, aquatic"); when false, uses the raw query.
  const [expandQuery, setExpandQuery] = useState(true);

  // Scroll collection chips
  const scrollCollectionChips = (direction: "left" | "right") => {
    if (collectionScrollRef.current) {
      const scrollAmount = 200;
      collectionScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Fetch collections on mount
  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const response = await fetch("/api/user-collections");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCollections(data.data.map((col: { name: string; imageCount: number; videoCount: number }) => ({
            name: col.name,
            count: col.imageCount + col.videoCount
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  // Load collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Initialize first clip selection for each video when results change
  useEffect(() => {
    setSelectedClips(prev => {
      const newSelectedClips: Record<string, string> = {};
      Object.entries(videoResults).forEach(([videoUrl, videoResult]) => {
        if (videoResult.clips && videoResult.clips.length > 0 && !prev[videoUrl]) {
          newSelectedClips[videoUrl] = videoResult.clips[0].id;
        }
      });
      if (Object.keys(newSelectedClips).length > 0) {
        return { ...prev, ...newSelectedClips };
      }
      return prev;
    });
  }, [videoResults]);

  // Set up timeupdate listeners for videos to stop at clip end_time
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    Object.entries(videoResults).forEach(([videoUrl, videoResult]) => {
      const videoElement = videoRefs.current[videoUrl];
      const selectedClipId = selectedClips[videoUrl];

      if (videoElement && selectedClipId && videoResult.clips) {
        const selectedClip = videoResult.clips.find(clip => clip.id === selectedClipId);

        if (selectedClip) {
          const endTime = parseFloat(selectedClip.endTime);
          clipEndTimes.current[videoUrl] = endTime;

          const handleTimeUpdate = () => {
            const currentEndTime = clipEndTimes.current[videoUrl];
            if (currentEndTime && videoElement.currentTime >= currentEndTime) {
              videoElement.pause();
              videoElement.currentTime = currentEndTime;
            }
          };

          videoElement.addEventListener('timeupdate', handleTimeUpdate);

          cleanupFunctions.push(() => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            delete clipEndTimes.current[videoUrl];
          });
        }
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [videoResults, selectedClips]);

  // Handle clip click - seek video to clip start_time
  const handleClipClick = useCallback((videoUrl: string, clipId: string, startTime: number, endTime: number) => {
    // Update the end time ref immediately
    clipEndTimes.current[videoUrl] = endTime;

    // Update selected clip state
    setSelectedClips(prev => ({ ...prev, [videoUrl]: clipId }));

    const videoElement = videoRefs.current[videoUrl];
    if (videoElement) {
      // Seek to start time
      videoElement.currentTime = startTime;

      // Play the video
      videoElement.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, []);

  // Handle collection selection
  const toggleCollection = useCallback((collectionName: string) => {
    setSelectedCollections(prev => {
      if (collectionName === "all") {
        // If selecting "all", clear other selections
        return ["all"];
      }

      // If "all" was selected, deselect it and select this collection instead
      if (prev.includes("all")) {
        return [collectionName];
      }

      if (prev.includes(collectionName)) {
        // Deselect this collection
        const newSelection = prev.filter(c => c !== collectionName);
        // If nothing selected, default to "all"
        return newSelection.length === 0 ? ["all"] : newSelection;
      } else {
        // Select (max 3)
        if (prev.length >= 3) {
          toast({
            title: "Maximum 3 collections",
            description: "You can select up to 3 collections at once",
            variant: "default"
          });
          return prev;
        }
        return [...prev, collectionName];
      }
    });
  }, [toast]);
  const handleSearch = useCallback(async (override?: string) => {
    const q = (override ?? searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    setQueryInterpretation([]);
    if (override) setSearchQuery(override);

    const collectionsParam = selectedCollections.includes("all")
      ? "all"
      : selectedCollections.join(",");

    try {
      if (mode === "image") {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(q)}&collections=${encodeURIComponent(collectionsParam)}&topK=10&expandQuery=${expandQuery}`,
          { method: "GET" }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Search failed");
        }
        const data = await response.json();
        const results = (data.data?.results || []).map(
          (result: { id: string; score: number; imageUrl: string; collectionName?: string }) => ({
            id: result.id,
            imageUrl: result.imageUrl,
            score: result.score,
          })
        );
        setImageResults(results);
        setVideoResults({});
        setQueryInterpretation(generateQueryInterpretation(q));

        // Refresh onboarding state after successful search
        if (results.length > 0) {
          refreshOnboardingState().catch(console.error);
          // Celebrate first search
          const wasFirstSearch = results.length > 0 && !onboardingState?.hasSearched;
          if (wasFirstSearch) {
            toast({
              title: "🎉 You found your first result!",
              description: "This matched because of semantic similarity. Try searching for something else!",
              duration: 5000,
            });
          }
        }
      } else {
        const response = await fetch(
          `/api/videos/search-collections?query=${encodeURIComponent(q)}&collections=${encodeURIComponent(collectionsParam)}&topK=10&expandQuery=${expandQuery}`,
          { method: "GET" }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Search failed");
        }
        const data = await response.json();
        const results: VideoSearchResults = data.data?.results || {};
        setVideoResults(results);
        setImageResults([]);
        setQueryInterpretation(generateQueryInterpretation(q));

        // Refresh onboarding state after successful search
        if (Object.keys(results).length > 0) {
          refreshOnboardingState().catch(console.error);
          // Celebrate first search
          const wasFirstSearch = Object.keys(results).length > 0 && !onboardingState?.hasSearched;
          if (wasFirstSearch) {
            toast({
              title: "🎉 You found your first result!",
              description: "This matched because of semantic similarity. Try searching for something else!",
              duration: 5000,
            });
          }
        }
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
  }, [searchQuery, mode, toast, selectedCollections, expandQuery]);

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
  const avgConfidence = mode === "image"
    ? imageResults.reduce((sum, r) => sum + (r.score ? getMatchPercentage(r.score) : 0), 0) / Math.max(imageResults.length, 1)
    : Object.values(videoResults).reduce((sum, r) => sum + (r.bestScore ? getMatchPercentage(r.bestScore) : 0), 0) / Math.max(Object.keys(videoResults).length, 1);

  const hasResults = (mode === "image" ? imageResults.length : Object.keys(videoResults).length) > 0;

  // Example queries (replaces placeholder "Trending" with real, clickable examples)
  const exampleQueries = EXAMPLE_QUERIES;
  const hasContent = collections.reduce((a, c) => a + c.count, 0) > 0;

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden">
      {/* Header with Premium Gradient Background */}
      <div className="sticky top-0 left-0 right-0 z-[200] pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6 flex-shrink-0 overflow-hidden backdrop-blur-sm">
        {/* Atmospheric Gradient Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, 
              var(--page-accent-primary) / 0.15 0%, 
              var(--page-accent-secondary) / 0.10 30%, 
              var(--page-accent-tertiary) / 0.05 60%, 
              var(--background) 100%)`,
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, var(--page-accent-primary) 0%, transparent 40%),
                                radial-gradient(circle at 80% 80%, var(--page-accent-secondary) 0%, transparent 40%)`,
            }}
          />
        </div>
        <div className="relative z-10 page-animate-fade">
          {/* Header with Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <div>
              <h1 className={cn(
                "text-3xl sm:text-4xl font-bold mb-2",
                "font-[var(--page-font)]",
                "bg-gradient-to-r from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)]",
                "bg-clip-text text-transparent"
              )}>
                Search
              </h1>
              <p className={cn(
                "text-muted-foreground text-sm sm:text-base",
                "font-[var(--page-font)] font-medium"
              )}>
                Find specific moments in your media library instantly.
              </p>
              {collections && collections.length > 0 && !isLoadingCollections && collections.reduce((a, c) => a + c.count, 0) === 0 && (
                <p className="text-sm text-purple-600 mt-2">
                  <button
                    type="button"
                    onClick={() => router.push("/?view=uploads")}
                    className="font-medium hover:underline"
                  >
                    Upload your first files
                  </button>
                  {" "}to get started, then search by meaning here.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                size="sm"
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => router.push("/?view=uploads")}
                aria-label="Go to Uploads to add media"
              >
                <CloudUpload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>

          {/* Premium Search Bar */}
          <div className="relative w-full mb-4 sm:mb-5">
            <div className={cn(
              "relative flex items-center",
              "page-input-premium",
              "rounded-2xl sm:rounded-3xl",
              "px-4 sm:px-6 py-4 sm:py-5",
              "shadow-lg shadow-[var(--page-accent-primary)]/10",
              "hover:shadow-xl hover:shadow-[var(--page-accent-primary)]/20",
              "transition-all duration-300",
              "group"
            )}>
              <div className={cn(
                "relative rounded-xl p-2 mr-3 sm:mr-4",
                "bg-gradient-to-br from-[var(--page-accent-primary)]/20 to-[var(--page-accent-secondary)]/20",
                "border border-[var(--page-accent-primary)]/30"
              )}>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--page-accent-primary)] flex-shrink-0" />
              </div>
              <Input
                type="text"
                placeholder="e.g. person walking at sunset"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className={cn(
                  "flex-1 bg-transparent border-0",
                  "text-foreground placeholder:text-muted-foreground/60",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0",
                  "text-base sm:text-lg",
                  "font-[var(--page-font)] font-medium",
                  "!h-auto py-0 px-0 shadow-none rounded-none"
                )}
                aria-label="Search by meaning, e.g. person walking at sunset"
              />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-11 w-11 sm:h-12 sm:w-12",
                  "bg-gradient-to-br from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)]",
                  "hover:from-[var(--page-accent-secondary)] hover:to-[var(--page-accent-tertiary)]",
                  "text-white rounded-xl sm:rounded-2xl",
                  "ml-2 sm:ml-3 flex-shrink-0",
                  "shadow-lg shadow-[var(--page-accent-primary)]/30",
                  "hover:shadow-xl hover:shadow-[var(--page-accent-primary)]/40",
                  "transition-all duration-300",
                  "touch-manipulation",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "group-hover:scale-105"
                )}
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                aria-label="Run search"
                aria-busy={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Mode Buttons and Collection Selector - Same Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
            {/* Mode Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant={mode === "video" ? "default" : "outline"}
                onClick={() => {
                  setMode("video");
                  setImageResults([]);
                  setVideoResults({});
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={cn(
                  "flex-1 sm:flex-initial touch-manipulation",
                  "rounded-full px-4 sm:px-5 text-sm sm:text-base",
                  "font-[var(--page-font)] font-semibold",
                  "transition-all duration-300",
                  mode === "video"
                    ? "bg-gradient-to-r from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)] hover:from-[var(--page-accent-secondary)] hover:to-[var(--page-accent-tertiary)] text-white shadow-lg shadow-[var(--page-accent-primary)]/30"
                    : "border-[var(--page-border-subtle)] text-foreground hover:bg-[var(--page-surface-subtle)] bg-[var(--page-surface-elevated)] backdrop-blur-sm"
                )}
              >
                <Video className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Search Videos</span>
                <span className="sm:hidden">Videos</span>
              </Button>
              <Button
                variant={mode === "image" ? "default" : "outline"}
                onClick={() => {
                  setMode("image");
                  setImageResults([]);
                  setVideoResults({});
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={cn(
                  "flex-1 sm:flex-initial touch-manipulation",
                  "rounded-full px-4 sm:px-5 text-sm sm:text-base",
                  "font-[var(--page-font)] font-semibold",
                  "transition-all duration-300",
                  mode === "image"
                    ? "bg-gradient-to-r from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)] hover:from-[var(--page-accent-secondary)] hover:to-[var(--page-accent-tertiary)] text-white shadow-lg shadow-[var(--page-accent-primary)]/30"
                    : "border-[var(--page-border-subtle)] text-foreground hover:bg-[var(--page-surface-subtle)] bg-[var(--page-surface-elevated)] backdrop-blur-sm"
                )}
              >
                <ImageIcon className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Search Images</span>
                <span className="sm:hidden">Images</span>
              </Button>
            </div>

            {/* Expand query toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none" title="When on, AI expands your query (e.g. water → water, liquid, aquatic). When off, search uses your exact words.">
              <input
                type="checkbox"
                checked={expandQuery}
                onChange={(e) => setExpandQuery(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                aria-label="Expand query with AI"
              />
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">Expand query</span>
            </label>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-gray-200 flex-shrink-0" />

            {/* Collection Chips - Horizontal Scrollable */}
            <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
              {/* Label */}
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0 hidden sm:inline">
                in:
              </span>

              {/* Scroll Left Button */}
              <button
                onClick={() => scrollCollectionChips("left")}
                className="flex-shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>

              {/* Scrollable Collection Chips */}
              <div
                ref={collectionScrollRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth min-w-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {isLoadingCollections ? (
                  /* Collection Chips Skeleton */
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="flex-shrink-0 h-9 w-24 rounded-full" />
                    ))}
                  </>
                ) : (
                  <>
                    {/* All Collections Chip */}
                    <button
                      onClick={() => toggleCollection("all")}
                      className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation ${selectedCollections.includes("all")
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                        }`}
                    >
                      <span>All</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCollections.includes("all")
                          ? "bg-purple-500 text-purple-100"
                          : "bg-gray-200 text-gray-500"
                        }`}>
                        {collections.reduce((acc, c) => acc + c.count, 0)}
                      </span>
                    </button>

                    {/* Individual Collection Chips */}
                    {collections.map((collection) => (
                      <button
                        key={collection.name}
                        onClick={() => toggleCollection(collection.name)}
                        className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation ${selectedCollections.includes(collection.name)
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                          }`}
                      >
                        <span className="truncate max-w-[100px] sm:max-w-[120px]">{collection.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCollections.includes(collection.name)
                            ? "bg-purple-500 text-purple-100"
                            : "bg-gray-200 text-gray-500"
                          }`}>
                          {collection.count}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Scroll Right Button */}
              <button
                onClick={() => scrollCollectionChips("right")}
                className="flex-shrink-0 w-8 h-8 sm:w-7 sm:h-7 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>

              {/* Selection Info */}
              {!selectedCollections.includes("all") && selectedCollections.length > 0 && (
                <span className="flex-shrink-0 text-xs text-purple-600 font-medium whitespace-nowrap hidden sm:inline">
                  {selectedCollections.length}/3
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Results Section with Sidebar */}
      <div className="flex gap-3 sm:gap-6 px-3 sm:px-6 flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Left Column - Results */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search Results Header - Sticky */}
          {!isSearching && hasResults && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-white sticky top-0 z-10 border-b border-gray-100 flex-shrink-0 gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Results</h2>
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                  {mode === "image" ? imageResults.length : Object.keys(videoResults).length}
                </span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                <span className="hidden sm:inline">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto border-0 bg-transparent text-gray-900 hover:bg-gray-50 rounded-lg gap-1 pl-1 pr-0 h-auto py-0 font-medium text-xs sm:text-sm">
                    <span className="hidden sm:inline">Relevance</span>
                    <span className="sm:hidden">Sort</span>
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
          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-4 sm:px-6">
            {/* Search Results */}
            {isSearching ? (
              <SearchResultsSkeleton />
            ) : mode === "image" ? (
              imageResults.length > 0 ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
                  {imageResults.map((result) => {
                    const matchPercentage = result.score ? getMatchPercentage(result.score) : 0;
                    const sceneSummary = "Image";
                    const isExpanded = expandedDescriptions.has(result.id);
                    const matchReasons = { matched: [], additional: [] };

                    return (
                      <Card
                        key={result.id}
                        className={cn(
                          "page-card-premium",
                          "overflow-hidden rounded-xl sm:rounded-2xl",
                          "touch-manipulation",
                          "page-animate-scale",
                          compactMode ? "p-2 sm:p-3" : "p-3 sm:p-4"
                        )}
                      >
                        <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row"} gap-3 sm:gap-5`}>
                          {/* Thumbnail */}
                          <div className={`relative ${viewMode === "grid" ? "w-full aspect-square" : "w-full xs:w-32 h-48 xs:h-32"} flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-gray-100`}>
                            {viewMode === "list" ? (
                              <Image
                                src={result.imageUrl}
                                alt={sceneSummary}
                                fill
                                className="object-cover"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={85}
                              />
                            ) : (
                              <Image
                                src={result.imageUrl}
                                alt={sceneSummary}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={85}
                              />
                            )}
                            {matchPercentage > 0 && (
                              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-purple-600 text-white text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 group">
                                {matchPercentage}% Match
                                <div className="absolute left-0 top-6 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 hidden sm:block">
                                  Semantic similarity score between your query and this image
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-1.5">
                                {sceneSummary}
                              </h3>
                              {!compactMode && (
                                <>
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
                                  onClick={() => handleDownloadImage(result.imageUrl)}
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
                <></>
              )
            ) : (
              Object.keys(videoResults).length > 0 ? (
                <div className={viewMode === "grid" ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
                  {Object.entries(videoResults).map(([videoUrl, videoResult]) => {
                    const matchPercentage = videoResult.bestScore ? getMatchPercentage(videoResult.bestScore) : 0;
                    const videoTitle = videoResult.title || videoResult.videoUrl.split('/').pop()?.split('?')[0] || 'Video';
                    const videoDuration = videoResult.duration || 0;
                    const clips = videoResult.clips || [];

                    // Calculate progress bar segments
                    const progressSegments = clips.map(clip => {
                      const start = parseFloat(clip.startTime);
                      const end = parseFloat(clip.endTime);
                      const startPercent = videoDuration > 0 ? (start / videoDuration) * 100 : 0;
                      const widthPercent = videoDuration > 0 ? ((end - start) / videoDuration) * 100 : 0;
                      return { startPercent, widthPercent, clip };
                    });

                    return (
                      <Card
                        key={videoResult.videoUrl}
                        className={cn(
                          "page-card-premium",
                          "overflow-hidden relative rounded-xl sm:rounded-2xl",
                          "p-3 sm:p-4 touch-manipulation group",
                          "page-animate-scale"
                        )}
                      >
                        <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row"} gap-3 sm:gap-5`}>
                          {/* Thumbnail */}
                          <div className="relative w-[300px] h-[250px] flex-shrink-0 rounded-lg sm:rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center shadow-lg border border-gray-200 transition-all duration-200 group-hover:shadow-2xl group-hover:border-purple-200">
                            {videoResult.videoUrl ? (
                              <>
                                <video
                                  src={videoResult.videoUrl}
                                  className="w-full h-full object-contain cursor-pointer relative z-0 rounded-lg"
                                  controls
                                  controlsList="nodownload"
                                  muted
                                  playsInline
                                  preload="metadata"
                                  style={{
                                    backgroundColor: '#000',
                                  }}
                                  onLoadedMetadata={(e) => {
                                    const video = e.currentTarget;
                                    const selectedClipId = selectedClips[videoResult.videoUrl];
                                    if (selectedClipId && clips.length > 0) {
                                      const clip = clips.find(c => c.id === selectedClipId) || clips[0];
                                      if (clip) {
                                        const startTime = parseFloat(clip.startTime);
                                        if (startTime >= 0 && startTime < video.duration) {
                                          video.currentTime = startTime;
                                        }
                                      }
                                    }
                                  }}
                                  ref={(video) => {
                                    if (video) {
                                      video.setAttribute('webkit-playsinline', 'true');
                                      videoRefs.current[videoResult.videoUrl] = video;
                                    } else {
                                      delete videoRefs.current[videoResult.videoUrl];
                                    }
                                  }}
                                />
                                {/* Match badge */}
                                {matchPercentage > 0 && (
                                  <div className="absolute top-3 left-3 bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg z-10 pointer-events-none shadow-lg backdrop-blur-sm border border-purple-500/30">
                                    {matchPercentage}% Match
                                  </div>
                                )}
                                {/* Duration badge */}
                                {videoDuration > 0 && (
                                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-lg z-10 pointer-events-none shadow-lg border border-white/10">
                                    {formatTime(videoDuration)}
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
                          <div className="flex-1 flex flex-col justify-between min-w-0 pr-6 sm:pr-8">
                            <div>
                              <div className="flex flex-col mb-1.5 sm:mb-2">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
                                  {videoTitle}
                                </h3>
                                {videoDuration > 0 && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Duration: {formatTime(videoDuration)}
                                  </p>
                                )}
                              </div>

                              {/* Matches Section */}
                              {clips.length > 0 && (
                                <div className="mt-3 sm:mt-4 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-3 py-1 text-xs font-medium">
                                      {clips.length} Matches
                                    </span>
                                    <span className="text-xs text-gray-600 font-medium">Found in this video</span>
                                  </div>

                                  {/* Progress Bar */}
                                  {videoDuration > 0 && (
                                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                      {progressSegments.map((segment, idx) => (
                                        <div
                                          key={idx}
                                          className="absolute h-full bg-purple-600 rounded-full"
                                          style={{
                                            left: `${segment.startPercent}%`,
                                            width: `${segment.widthPercent}%`,
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}

                                  {/* Match Entries - Scrollable */}
                                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                                    {clips.map((clip, idx) => {
                                      const startTime = parseFloat(clip.startTime);
                                      const endTime = parseFloat(clip.endTime);
                                      const clipScore = getMatchPercentage(clip.score);
                                      const isSelected = selectedClips[videoResult.videoUrl] === clip.id;

                                      return (
                                        <div
                                          key={clip.id}
                                          className={`flex items-start gap-2 p-2 rounded-lg transition-all duration-200 cursor-pointer group ${isSelected
                                              ? 'bg-purple-50 border border-purple-200 hover:bg-purple-100 hover:border-purple-400 hover:shadow-md hover:scale-[1.02]'
                                              : 'bg-white border border-transparent hover:bg-purple-50 hover:border-purple-200 hover:shadow-md hover:scale-[1.02]'
                                            }`}
                                          onClick={() => handleClipClick(videoResult.videoUrl, clip.id, startTime, endTime)}
                                        >
                                          <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                            <video
                                              src={videoResult.videoUrl}
                                              className="w-full h-full object-cover"
                                              preload="metadata"
                                              onLoadedMetadata={(e) => {
                                                const video = e.currentTarget;
                                                if (startTime > 0 && startTime < video.duration) {
                                                  video.currentTime = startTime;
                                                }
                                              }}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                                              <div className="flex items-center gap-2">
                                                <Clock className={`h-3 w-3 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                                                <span className={`text-xs font-medium transition-colors duration-200 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                                                  {formatTime(startTime)} - {formatTime(endTime)}
                                                </span>
                                              </div>
                                              <span className={`text-xs truncate transition-colors duration-200 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} title={videoTitle}>
                                                {videoTitle}
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 flex-shrink-0 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (videoResult.videoUrl && startTime >= 0 && endTime > startTime) {
                                                  handleDownloadVideo(videoResult.videoUrl, startTime, endTime);
                                                }
                                              }}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                !isLoadingCollections && <EmptyStateSearch
                  hasContent={hasContent}
                  searchQuery={searchQuery}
                  onExampleClick={handleExampleClick}
                  exampleQueries={exampleQueries}
                />
              )
            )}

          </div>
        </div>

        {/* Right Sidebar - Sticky */}
        {hasResults && (
          <div className="w-64 lg:w-80 flex-shrink-0 sticky top-0 self-start space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-6 hidden md:block">
            {/* Search Insights */}
            <Card className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Search Insights</h3>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Hits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(mode === "image" ? imageResults.length : Object.keys(videoResults).length).toLocaleString()}
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

            {/* Your collections (real data) */}
            {collections.length > 0 && (
              <Card className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Your collections</h3>
                  <button
                    type="button"
                    onClick={() => router.push("/?view=collections")}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {collections.slice(0, 4).map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleCollection(col.name)}
                      className="w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Folder className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800">{col.name}</span>
                          <p className="text-xs text-gray-500">{col.count} items</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Search tips */}
            <Card className="p-4 bg-purple-50 border border-purple-100 rounded-xl relative overflow-hidden">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 pr-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Refine your search</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Try: broader terms, emotions, or actions.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["person walking", "sunset landscape", "dramatic sky"].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => handleExampleClick(ex)}
                        className="text-xs px-2.5 py-1 bg-white/80 hover:bg-white border border-purple-200 rounded-full text-purple-700 font-medium"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
