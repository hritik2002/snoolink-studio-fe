"use client";

import { Clock, Download, Film, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/file-format";
import { getVideoDisplayInfo, truncateMatchText } from "@/lib/video-display";
import { MatchTimeline } from "./MatchTimeline";

export interface VideoClip {
  id: string;
  score: number;
  startTime: string;
  endTime: string;
  text?: string;
}

export interface VideoSearchResult {
  videoUrl: string;
  videoId?: number;
  title?: string;
  description?: string;
  duration?: number;
  resolution?: string;
  collectionName?: string;
  clips: VideoClip[];
  bestScore: number;
}

export type VideoSearchResults = Record<string, VideoSearchResult>;

interface SearchResultCardProps {
  result: VideoSearchResult;
  selectedClipId?: string;
  onClipSelect: (
    videoUrl: string,
    clipId: string,
    startTime: number,
    endTime: number
  ) => void;
  onDownload: (videoUrl: string, startTime: number, endTime: number) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  onVideoLoaded: (video: HTMLVideoElement) => void;
}

function matchPercent(score: number): number {
  return Math.round(score * 100);
}

export function SearchResultCard({
  result,
  selectedClipId,
  onClipSelect,
  onDownload,
  videoRef,
  onVideoLoaded,
}: SearchResultCardProps) {
  const { videoUrl, duration = 0, clips = [], bestScore, collectionName } =
    result;
  const matchPercentage = bestScore ? matchPercent(bestScore) : 0;
  const { label, subtitle } = getVideoDisplayInfo(
    result.title,
    videoUrl,
    result.description
  );

  const timelineSegments = clips.map((clip) => ({
    id: clip.id,
    start: parseFloat(clip.startTime),
    end: parseFloat(clip.endTime),
    score: clip.score,
  }));

  return (
    <article className="glue-card rounded-card shadow-card animate-app-fade-up">
      <div className="glue-card-accent" aria-hidden />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
          {/* Video player — clean, no overlay badges */}
          <div className="w-full lg:w-[min(420px,42%)] shrink-0">
            <div className="relative aspect-video rounded-app-md overflow-hidden bg-[#0a0a0a] border border-app-border shadow-card-md">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  controlsList="nodownload"
                  muted
                  playsInline
                  preload="metadata"
                  ref={videoRef}
                  onLoadedMetadata={(e) => onVideoLoaded(e.currentTarget)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="size-8 text-app-4" />
                </div>
              )}
            </div>
          </div>

          {/* Match details */}
          <div className="flex-1 min-w-0 flex flex-col">
            <header className="mb-5 pb-4 border-b border-app-border-light">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-app-1 leading-snug tracking-[-0.02em]">
                    {label}
                  </h3>
                  {subtitle && (
                    <p className="text-[13px] text-app-3 mt-1 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                {matchPercentage > 0 && (
                  <div className="shrink-0 inline-flex flex-col items-end gap-0.5">
                    <span className="text-[22px] font-bold text-app-orange tabular-nums leading-none">
                      {matchPercentage}%
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-app-4">
                      best match
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {collectionName && (
                  <span className="inline-flex items-center rounded-app-sm bg-app-active border border-app-border-input px-2.5 py-1 text-[12px] font-medium text-app-2">
                    {collectionName}
                  </span>
                )}
                {duration > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-app-3">
                    <Clock className="size-3.5 text-app-4" />
                    <span className="tabular-nums">{formatDuration(duration)}</span>
                  </span>
                )}
                {clips.length > 0 && (
                  <span className="text-[12px] text-app-4">
                    · {clips.length} {clips.length === 1 ? "moment" : "moments"}
                  </span>
                )}
              </div>
            </header>

            {clips.length > 0 && (
              <div className="flex flex-col flex-1 min-h-0 gap-4">
                {duration > 0 && (
                  <MatchTimeline
                    duration={duration}
                    segments={timelineSegments}
                    selectedId={selectedClipId}
                    onSelect={(id, start, end) =>
                      onClipSelect(videoUrl, id, start, end)
                    }
                  />
                )}

                <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1 -mr-1">
                  {clips.map((clip, idx) => {
                    const startTime = parseFloat(clip.startTime);
                    const endTime = parseFloat(clip.endTime);
                    const clipScore = matchPercent(clip.score);
                    const isSelected = selectedClipId === clip.id;
                    const matchContext = truncateMatchText(clip.text);

                    return (
                      <li key={clip.id}>
                        <button
                          type="button"
                          onClick={() =>
                            onClipSelect(videoUrl, clip.id, startTime, endTime)
                          }
                          className={cn(
                            "group w-full flex gap-3 p-3 rounded-app-md text-left",
                            "transition-all duration-150 border",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/40",
                            isSelected
                              ? "bg-white border-app-orange/40 shadow-sm ring-1 ring-app-orange/10"
                              : "bg-white/60 border-app-border-light hover:border-app-border-input hover:bg-white"
                          )}
                        >
                          <div className="relative size-16 shrink-0 rounded-app-md overflow-hidden bg-app-active border border-app-border-light">
                            <video
                              src={videoUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                              playsInline
                              onLoadedMetadata={(e) => {
                                const video = e.currentTarget;
                                if (
                                  startTime > 0 &&
                                  startTime < video.duration
                                ) {
                                  video.currentTime = startTime;
                                }
                              }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="size-5 text-white fill-white" />
                            </span>
                            <span className="absolute top-1 left-1 rounded-[4px] bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 tabular-nums">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-[15px] font-semibold tabular-nums tracking-tight",
                                  isSelected ? "text-app-1" : "text-app-2"
                                )}
                              >
                                {formatDuration(startTime)}
                                <span className="text-app-4 font-normal mx-1">
                                  –
                                </span>
                                {formatDuration(endTime)}
                              </p>
                              {clipScore > 0 && (
                                <span
                                  className={cn(
                                    "shrink-0 text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-app-sm",
                                    isSelected
                                      ? "bg-app-orange/15 text-app-orange"
                                      : "bg-app-active text-app-3"
                                  )}
                                >
                                  {clipScore}%
                                </span>
                              )}
                            </div>

                            {matchContext ? (
                              <p className="text-[13px] text-app-3 mt-1.5 line-clamp-2 leading-relaxed">
                                {matchContext}
                              </p>
                            ) : (
                              <p className="text-[13px] text-app-4 mt-1.5 italic">
                                Matched segment in this video
                              </p>
                            )}
                          </div>

                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Download clip"
                            className={cn(
                              "shrink-0 self-center p-2 rounded-app-sm text-app-4",
                              "hover:text-app-orange hover:bg-app-orange/10 transition-colors",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/40"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                videoUrl &&
                                startTime >= 0 &&
                                endTime > startTime
                              ) {
                                onDownload(videoUrl, startTime, endTime);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                if (
                                  videoUrl &&
                                  startTime >= 0 &&
                                  endTime > startTime
                                ) {
                                  onDownload(videoUrl, startTime, endTime);
                                }
                              }
                            }}
                          >
                            <Download className="size-4" />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
