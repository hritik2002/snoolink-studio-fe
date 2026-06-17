"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search, Loader2, Image as ImageIcon, Video, Clock, Download, Share2,
  MoreVertical, Sparkles, ChevronDown, ChevronUp, List as ListIcon, Play, Star, ArrowRight, Plus, CloudUpload, X
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
import {
  appBtnPrimary,
  appBtnSecondary,
  appChip,
  appChipActive,
  appSegmentActive,
  appSegmentControl,
  appSegmentInactive,
} from "@/lib/app-classes";

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

  // Expand query: when true, backend expands the search query with AI
  const [expandQuery, setExpandQuery] = useState(true);

  // Right sidebar state
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const sidebarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Right sidebar handlers
  const openRightSidebar = useCallback(() => {
    setIsRightSidebarOpen(true);
    // Clear any existing timeout
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
    }
    // Set auto-close after 30 seconds
    sidebarTimeoutRef.current = setTimeout(() => {
      setIsRightSidebarOpen(false);
    }, 30000);
  }, []);

  const resetSidebarTimer = useCallback(() => {
    // Reset the timer when user interacts with sidebar
    if (sidebarTimeoutRef.current) {
      clearTimeout(sidebarTimeoutRef.current);
    }
    if (isRightSidebarOpen) {
      sidebarTimeoutRef.current = setTimeout(() => {
        setIsRightSidebarOpen(false);
      }, 30000);
    }
  }, [isRightSidebarOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sidebarTimeoutRef.current) {
        clearTimeout(sidebarTimeoutRef.current);
      }
    };
  }, []);

  // Example queries (replaces placeholder "Trending" with real, clickable examples)
  const exampleQueries = EXAMPLE_QUERIES;
  const hasContent = collections.reduce((a, c) => a + c.count, 0) > 0;

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden relative z-[1] bg-white">
      {/* Search command bar */}
      <div className="sticky top-0 z-[200] flex-shrink-0 px-6 pt-5 pb-3 bg-white border-b border-app-border-light">
        <div className="max-w-[1220px] mx-auto">
          {/* Search row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex items-center h-11 bg-white border border-app-border-input rounded-app-md focus-within:border-app-3 transition-all duration-150">
              <Search className="h-4 w-4 text-app-4 ml-3 shrink-0" aria-hidden />
              <Input
                type="text"
                autoFocus
                placeholder="Describe what you're looking for…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent border-0 h-full text-[14px] text-app-1 placeholder:text-app-4 focus-visible:ring-0 focus-visible:border-0 !shadow-none rounded-none px-3"
                aria-label="Search by meaning"
              />
              <button
                type="button"
                className={cn(appBtnPrimary, "h-8 mr-1.5 shrink-0 disabled:opacity-40")}
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                aria-label="Run search"
                aria-busy={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push("/?view=uploads")}
              className={cn(appBtnSecondary, "hidden sm:inline-flex shrink-0 h-11")}
            >
              <CloudUpload className="h-4 w-4" aria-hidden />
              Upload
            </button>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={appSegmentControl}>
              <button
                type="button"
                onClick={() => {
                  setMode("video");
                  setImageResults([]);
                  setVideoResults({});
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-all duration-150",
                  mode === "video" ? appSegmentActive : appSegmentInactive
                )}
              >
                <Video className="h-3.5 w-3.5" aria-hidden />
                Videos
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("image");
                  setImageResults([]);
                  setVideoResults({});
                  setQueryInterpretation([]);
                }}
                disabled={isSearching}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-all duration-150",
                  mode === "image" ? appSegmentActive : appSegmentInactive
                )}
              >
                <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                Images
              </button>
            </div>

            <div className="hidden sm:block w-px h-5 bg-app-border-input" />

            {/* Collection chips */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              {isLoadingCollections ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-16 shrink-0 rounded-badge" />
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => toggleCollection("all")}
                    className={cn(
                      appChip,
                      selectedCollections.includes("all") && appChipActive
                    )}
                  >
                    All
                    <span className="text-cg-ink-4 tabular-nums">
                      {collections.reduce((acc, c) => acc + c.count, 0)}
                    </span>
                  </button>
                  {collections.map((collection) => (
                    <button
                      key={collection.name}
                      type="button"
                      onClick={() => toggleCollection(collection.name)}
                      className={cn(
                        appChip,
                        "max-w-[140px] truncate",
                        selectedCollections.includes(collection.name) && appChipActive
                      )}
                    >
                      {collection.name}
                      <span className="text-cg-ink-4 tabular-nums shrink-0">
                        {collection.count}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Expand query */}
            <button
              type="button"
              onClick={() => setExpandQuery(!expandQuery)}
              title="Expand query with AI synonyms"
              className={cn(
                appChip,
                expandQuery && appChipActive
              )}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Expand</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/?view=uploads")}
              className={cn(appBtnSecondary, "sm:hidden shrink-0 h-9 w-9 p-0 justify-center")}
              aria-label="Upload"
            >
              <CloudUpload className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Section with Sidebar */}
      <div className="relative flex gap-3 sm:gap-6 px-3 sm:px-6 flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Left Column - Results */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search Results Header - Sticky */}
          {!isSearching && hasResults && (
            <div className="flex items-center justify-between py-3 px-4 sm:px-6 border-b border-cg-line flex-shrink-0 bg-cg-bg/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-cg-orange font-semibold tabular-nums">
                  {mode === "image" ? imageResults.length : Object.keys(videoResults).length}
                </span>
                <span className="text-sm text-cg-ink-4">results</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openRightSidebar}
                  className="hidden md:flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground h-8 px-2"
                  aria-label="Open insights"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Insights
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-auto border-0 bg-transparent text-[13px] text-muted-foreground hover:text-foreground/80 h-8 px-2 gap-1">
                    Relevance
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
                          "glue-card overflow-hidden rounded-img touch-manipulation border border-border bg-card",
                          compactMode ? "p-2 sm:p-3" : "p-3 sm:p-4"
                        )}
                      >
                        <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row"} gap-3 sm:gap-5`}>
                          {/* Thumbnail */}
                          <div className={`relative ${viewMode === "grid" ? "w-full aspect-square" : "w-full xs:w-32 h-48 xs:h-32"} flex-shrink-0 rounded-btn overflow-hidden bg-muted`}>
                            {viewMode === "list" ? (
                              <Image
                                src={result.imageUrl}
                                alt={sceneSummary}
                                fill
                                className="object-cover"
                                loading="lazy"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                quality={85}
                                unoptimized
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
                                unoptimized
                              />
                            )}
                            {matchPercentage > 0 && (
                              <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-primary text-white text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 group">
                                {matchPercentage}% Match
                                <div className="absolute left-0 top-6 w-48 p-2 bg-secondary text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 hidden sm:block">
                                  Semantic similarity score between your query and this image
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-1.5">
                                {sceneSummary}
                              </h3>
                              {!compactMode && (
                                <>
                                  {matchReasons.matched.length > 0 && (
                                    <div className="mb-3 p-2 bg-muted/30 rounded border border-border">
                                      <p className="text-xs font-medium text-foreground/80 mb-1.5">Why this matched:</p>
                                      <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
                                        {matchReasons.matched.map((reason, idx) => (
                                          <li key={idx} className="flex items-start gap-1">
                                            <span className="text-primary">•</span>
                                            <span>{reason}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      {matchReasons.additional.length > 0 && (
                                        <>
                                          <p className="text-xs font-medium text-muted-foreground mb-1">Additional context detected:</p>
                                          <ul className="text-xs text-muted-foreground space-y-0.5">
                                            {matchReasons.additional.map((reason, idx) => (
                                              <li key={idx} className="flex items-start gap-1">
                                                <span className="text-muted-foreground">•</span>
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
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => handleDownloadImage(result.imageUrl)}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Download
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                                  Share
                                </Button>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground/80">
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
                          "glue-card overflow-hidden relative rounded-none p-3 sm:p-4 touch-manipulation group border border-border bg-input"
                        )}
                      >
                        <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-col sm:flex-row"} gap-3 sm:gap-5`}>
                          {/* Thumbnail */}
                          <div className="relative w-[300px] h-[250px] flex-shrink-0 rounded-none overflow-hidden bg-secondary flex items-center justify-center shadow-lg border border-border transition-all duration-200 group-hover:shadow-2xl group-hover:border-primary/20">
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
                                  <div className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg z-10 pointer-events-none shadow-lg backdrop-blur-sm border border-primary/30">
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
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 flex flex-col justify-between min-w-0 pr-6 sm:pr-8">
                            <div>
                              <div className="flex flex-col mb-1.5 sm:mb-2">
                                <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">
                                  {videoTitle}
                                </h3>
                                {videoDuration > 0 && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Duration: {formatTime(videoDuration)}
                                  </p>
                                )}
                              </div>

                              {/* Matches Section */}
                              {clips.length > 0 && (
                                <div className="mt-3 sm:mt-4 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-primary/5 border border-primary/20 text-primary rounded-full px-3 py-1 text-xs font-medium">
                                      {clips.length} Matches
                                    </span>
                                    <span className="text-xs text-muted-foreground font-medium">Found in this video</span>
                                  </div>

                                  {/* Progress Bar */}
                                  {videoDuration > 0 && (
                                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                      {progressSegments.map((segment, idx) => (
                                        <div
                                          key={idx}
                                          className="absolute h-full bg-primary rounded-full"
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
                                              ? 'bg-primary/5 border border-primary/20 hover:bg-primary/10 hover:border-primary/40 hover:shadow-md hover:scale-[1.02]'
                                              : 'bg-card border border-transparent hover:bg-primary/5 hover:border-primary/20 hover:shadow-md hover:scale-[1.02]'
                                            }`}
                                          onClick={() => handleClipClick(videoResult.videoUrl, clip.id, startTime, endTime)}
                                        >
                                          <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 overflow-hidden">
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
                                                <Clock className={`h-3 w-3 flex-shrink-0 transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <span className={`text-xs font-medium transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                                  {formatTime(startTime)} - {formatTime(endTime)}
                                                </span>
                                              </div>
                                              <span className={`text-xs truncate transition-colors duration-200 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} title={videoTitle}>
                                                {videoTitle}
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200"
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
          <div 
            className={cn(
              "flex-shrink-0 sticky top-0 self-start space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pb-6 hidden md:block transition-all duration-300 ease-in-out",
              isRightSidebarOpen 
                ? "w-64 lg:w-80 translate-x-0 opacity-100 pointer-events-auto" 
                : "w-0 translate-x-full opacity-0 pointer-events-none overflow-hidden"
            )}
            onClick={resetSidebarTimer}
          >
            {/* Search Insights */}
            <Card className="p-4 glue-card relative">              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-mono uppercase tracking-wide text-white/90">Insights</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-border p-3">
                  <p className="text-[13px] text-muted-foreground mb-1">Hits</p>
                  <p className="font-mono text-2xl font-bold text-primary">
                    {(mode === "image" ? imageResults.length : Object.keys(videoResults).length).toLocaleString()}
                  </p>
                </div>
                <div className="border border-border p-3">
                  <p className="text-[13px] text-muted-foreground mb-1">Avg. conf.</p>
                  <p className="font-mono text-2xl font-bold text-primary">{Math.round(avgConfidence)}%</p>
                </div>
              </div>

              {(queryInterpretation.length > 0) && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[13px] text-muted-foreground mb-2">Concepts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {queryInterpretation.slice(0, 4).map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[13px] border border-primary/30 text-primary"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Your collections (real data) */}
            {collections.length > 0 && (
              <div className="glue-card p-4 relative">                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-muted-foreground">Collections</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetSidebarTimer();
                      router.push("/?view=collections");
                    }}
                    className="text-[13px] text-primary hover:text-primary/80"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-1">
                  {collections.slice(0, 4).map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetSidebarTimer();
                        toggleCollection(col.name);
                      }}
                      className="w-full flex items-center justify-between py-2 text-left text-sm text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <span className="truncate">{col.name}</span>
                      <span className="text-[13px] text-muted-foreground shrink-0 ml-2">{col.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search tips */}
            <div className="glue-card p-4 relative">              <p className="text-[13px] text-muted-foreground mb-3">Try broader terms or actions.</p>
              <div className="flex flex-wrap gap-1.5">
                {["person walking", "sunset landscape", "dramatic sky"].map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetSidebarTimer();
                      handleExampleClick(ex);
                    }}
                    className="text-[13px] px-2.5 py-1 border border-border text-foreground/70 hover:border-primary/40 hover:text-primary transition-colors duration-150"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
