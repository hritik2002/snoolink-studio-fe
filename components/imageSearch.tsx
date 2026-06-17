"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Loader2, Video, Clock, Download, ArrowRight } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { AppPageLoader } from "@/components/app/AppSpinner";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyStateSearch } from "@/components/onboarding/EmptyStateSearch";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { appBtnPrimary, appChip, appChipActive } from "@/lib/app-classes";

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
      const response = await fetch(
        `/api/videos/search-collections?query=${encodeURIComponent(q)}&collections=${encodeURIComponent(collectionsParam)}&topK=10&expandQuery=true`,
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
  }, [searchQuery, toast, selectedCollections, refreshOnboardingState, onboardingState?.hasSearched]);

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
  const hasResults = resultCount > 0;

  // Example queries (replaces placeholder "Trending" with real, clickable examples)
  const exampleQueries = EXAMPLE_QUERIES;
  const hasContent = collections.reduce((a, c) => a + c.count, 0) > 0;

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 overflow-hidden relative z-[1] bg-white">
      {/* Search command bar */}
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

      <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden px-3 sm:px-6">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-[1220px] mx-auto w-full">
          {!isSearching && hasResults && (
            <div className="flex items-center py-3 px-4 sm:px-6 border-b border-app-border-light flex-shrink-0">
              <span className="text-sm text-app-3">
                <span className="font-semibold text-app-1 tabular-nums">{resultCount}</span>{" "}
                {resultCount === 1 ? "result" : "results"}
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-4 sm:px-6">
            {isSearching ? (
              <AppPageLoader minHeight="min-h-[320px]" />
            ) : resultCount > 0 ? (
              <div className="space-y-3 sm:space-y-4">
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
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
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
    </div>
  );
}
