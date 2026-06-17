"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { AppPageLoader } from "@/components/app/AppSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateSearch } from "@/components/onboarding/EmptyStateSearch";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { appBtnPrimary, appChip, appChipActive } from "@/lib/app-classes";
import { SearchSettingsPopover } from "@/components/search/SearchSettingsPopover";
import { SearchResultsList } from "@/components/search/SearchResultsList";
import type { VideoSearchResults } from "@/components/search/SearchResultCard";
import {
  DEFAULT_SEARCH_SETTINGS,
  loadSearchSettings,
  saveSearchSettings,
  SEARCH_SETTINGS_STORAGE_KEY,
  type SearchSettings,
} from "@/lib/search-settings";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [videoResults, setVideoResults] = useState<VideoSearchResults>({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClips, setSelectedClips] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const clipEndTimes = useRef<Record<string, number>>({});
  const { toast } = useToast();
  const { refreshState: refreshOnboardingState, onboardingState } = useOnboarding();

  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>(["all"]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [searchSettings, setSearchSettings] = useState<SearchSettings>(DEFAULT_SEARCH_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const searchActionsRef = useRef<HTMLDivElement>(null);

  // Fetch collections on mount
  const fetchCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const response = await fetch("/api/user-collections");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCollections(data.data.map((col: { name: string; videoCount: number }) => ({
            name: col.name,
            count: col.videoCount ?? 0,
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

  // Load search settings (localStorage first, else user defaults from API)
  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(SEARCH_SETTINGS_STORAGE_KEY) : null;
    if (raw) {
      setSearchSettings(loadSearchSettings());
      return;
    }

    fetch("/api/user-model-settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return;
        const minScore = data.data.min_score;
        const next: SearchSettings = {
          minScore:
            minScore != null && !Number.isNaN(Number(minScore))
              ? Math.max(0, Math.min(1, Number(minScore)))
              : DEFAULT_SEARCH_SETTINGS.minScore,
          expandQuery: DEFAULT_SEARCH_SETTINGS.expandQuery,
        };
        setSearchSettings(next);
        saveSearchSettings(next);
      })
      .catch(() => {});
  }, []);

  const updateSearchSettings = useCallback((next: SearchSettings) => {
    setSearchSettings(next);
    saveSearchSettings(next);
  }, []);

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
    if (override) setSearchQuery(override);

    const collectionsParam = selectedCollections.includes("all")
      ? "all"
      : selectedCollections.join(",");

    try {
      const params = new URLSearchParams({
        query: q,
        collections: collectionsParam,
        topK: "10",
        expandQuery: searchSettings.expandQuery ? "true" : "false",
        minScore: searchSettings.minScore.toFixed(2),
      });

      const response = await fetch(
        `/api/videos/search-collections?${params.toString()}`,
        { method: "GET" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Search failed");
      }
      const data = await response.json();
      const results: VideoSearchResults = data.data?.results || {};
      setVideoResults(results);

      if (Object.keys(results).length > 0) {
        refreshOnboardingState().catch(console.error);
        const wasFirstSearch = Object.keys(results).length > 0 && !onboardingState?.hasSearched;
        if (wasFirstSearch) {
          toast({
            title: "🎉 You found your first result!",
            description: "This matched because of semantic similarity. Try searching for something else!",
            duration: 5000,
          });
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
  }, [searchQuery, toast, selectedCollections, refreshOnboardingState, onboardingState?.hasSearched, searchSettings]);

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
    void handleSearch(example);
  }, [handleSearch]);

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

  const resultCount = Object.keys(videoResults).length;

  // Example queries (replaces placeholder "Trending" with real, clickable examples)
  const exampleQueries = EXAMPLE_QUERIES;
  const hasContent = collections.reduce((a, c) => a + c.count, 0) > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full min-w-0 relative z-[1] bg-white">
      {/* Search command bar — sticks while #main scrolls */}
      <div className="sticky top-0 z-[200] flex-shrink-0 px-6 pt-5 pb-3 bg-white border-b border-app-border-light">
        <div className="max-w-[1220px] mx-auto">
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
                aria-label="Search videos by meaning"
              />
              <div
                ref={searchActionsRef}
                className="relative flex items-center gap-2 shrink-0 mr-2"
              >
                <button
                  type="button"
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-app-md",
                    "border border-app-border-input bg-white text-app-3",
                    "hover:text-app-2 hover:bg-app-hover transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border",
                    settingsOpen && "bg-app-active text-app-1 border-app-3"
                  )}
                  onClick={() => setSettingsOpen((open) => !open)}
                  aria-label="Search settings"
                  aria-expanded={settingsOpen}
                  aria-haspopup="dialog"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    appBtnPrimary,
                    "h-9 gap-1.5 px-4 shrink-0 disabled:opacity-40"
                  )}
                  onClick={() => handleSearch()}
                  disabled={isSearching || !searchQuery.trim()}
                  aria-label="Run search"
                  aria-busy={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Searching</span>
                    </>
                  ) : (
                    <>
                      <span>Search</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <SearchSettingsPopover
                  open={settingsOpen}
                  onClose={() => setSettingsOpen(false)}
                  settings={searchSettings}
                  onChange={updateSearchSettings}
                  anchorRef={searchActionsRef}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto scrollbar-hide">
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
        </div>
      </div>

      <div className="relative flex-1 min-w-0 px-3 sm:px-6 bg-cg-bg-alt">
        <div className="max-w-[1220px] mx-auto w-full px-4 sm:px-6 pb-6 min-h-full flex flex-col">
          {isSearching ? (
              <AppPageLoader minHeight="min-h-[320px]" />
            ) : resultCount > 0 ? (
              <SearchResultsList
                results={videoResults}
                searchQuery={searchQuery}
                selectedClips={selectedClips}
                videoRefs={videoRefs}
                onClipSelect={handleClipClick}
                onDownload={handleDownloadVideo}
              />
            ) : (
              !isLoadingCollections && (
                <EmptyStateSearch
                  hasContent={hasContent}
                  searchQuery={searchQuery}
                  onExampleClick={handleExampleClick}
                  exampleQueries={exampleQueries}
                />
              )
            )}
        </div>
      </div>
    </div>
  );
}
