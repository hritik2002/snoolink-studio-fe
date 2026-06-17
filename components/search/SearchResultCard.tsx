"use client";

import { useCallback } from "react";
import { Clock, Download, Film, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/file-format";
import { getVideoDisplayInfo } from "@/lib/video-display";

export interface VideoClip {
  id: string;
  score: number;
  startTime: string;
  endTime: string;
}

export interface VideoSearchResult {
  videoUrl: string;
  videoId?: number;
  title?: string;
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

function clipDurationLabel(start: number, end: number): string {
  const secs = Math.max(0, Math.round(end - start));
  return secs < 60 ? `${secs}s` : formatDuration(secs);
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
  const { label, fileId } = getVideoDisplayInfo(result.title, videoUrl);

  const progressSegments = clips.map((clip) => {
    const start = parseFloat(clip.startTime);
    const end = parseFloat(clip.endTime);
    const startPercent = duration > 0 ? (start / duration) * 100 : 0;
    const widthPercent = duration > 0 ? ((end - start) / duration) * 100 : 0;
    return { startPercent, widthPercent, clip, start, end };
  });

  const handleTimelineClick = useCallback(
    (clip: VideoClip, start: number, end: number) => {
      onClipSelect(videoUrl, clip.id, start, end);
    },
    [onClipSelect, videoUrl]
  );

  return (
    <article className="glue-card rounded-card shadow-card animate-app-fade-up">
      <div className="glue-card-accent" aria-hidden />
      <div className="relative p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
          {/* Video player */}
          <div className="w-full lg:w-[min(420px,42%)] shrink-0">
            <div className="relative aspect-video rounded-app-md overflow-hidden bg-[#0a0a0a] border border-app-border shadow-card-md group/player">
              {videoUrl ? (
                <>
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
                  {matchPercentage > 0 && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 rounded-pill bg-black/75 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 border border-white/10">
                        <span className="size-1.5 rounded-full bg-app-orange shrink-0" />
                        {matchPercentage}% match
                      </span>
                    </div>
                  )}
                  {duration > 0 && (
                    <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                      <span className="rounded-app-sm bg-black/75 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 tabular-nums">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="size-8 text-app-4" />
                </div>
              )}
            </div>
          </div>

          {/* Match details */}
          <div className="flex-1 min-w-0 flex flex-col">
            <header className="mb-4">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <h3 className="text-[16px] sm:text-[17px] font-semibold text-app-1 leading-snug tracking-[-0.01em]">
                  {label}
                </h3>
                {collectionName && (
                  <span className="inline-flex items-center rounded-app-sm bg-app-active border border-app-border-input px-2 py-0.5 text-[11px] font-medium text-app-3">
                    {collectionName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-app-3">
                {duration > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-app-4" />
                    {formatDuration(duration)}
                  </span>
                )}
                {fileId && (
                  <span className="font-mono text-[12px] text-app-4">{fileId}</span>
                )}
              </div>
            </header>

            {clips.length > 0 && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[13px] font-medium text-app-2">
                    <span className="tabular-nums">{clips.length}</span>{" "}
                    {clips.length === 1 ? "moment" : "moments"} found
                  </p>
                </div>

                {/* Interactive timeline */}
                {duration > 0 && (
                  <div
                    className="relative h-2.5 rounded-pill bg-app-active border border-app-border-light overflow-hidden mb-4"
                    role="group"
                    aria-label="Match timeline"
                  >
                    {progressSegments.map(
                      ({ startPercent, widthPercent, clip, start, end }, idx) => {
                        const isSelected = selectedClipId === clip.id;
                        return (
                          <button
                            key={clip.id}
                            type="button"
                            title={`Match ${idx + 1}: ${formatDuration(start)} – ${formatDuration(end)}`}
                            className={cn(
                              "absolute top-0 h-full min-w-[3px] transition-all duration-150",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/50 focus-visible:ring-offset-1",
                              isSelected
                                ? "bg-app-orange z-10"
                                : "bg-app-1/70 hover:bg-app-orange/80 z-0"
                            )}
                            style={{
                              left: `${startPercent}%`,
                              width: `${Math.max(widthPercent, 0.8)}%`,
                            }}
                            onClick={() => handleTimelineClick(clip, start, end)}
                          />
                        );
                      }
                    )}
                  </div>
                )}

                {/* Clip list */}
                <ul className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 -mr-1">
                  {clips.map((clip, idx) => {
                    const startTime = parseFloat(clip.startTime);
                    const endTime = parseFloat(clip.endTime);
                    const clipScore = matchPercent(clip.score);
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <li key={clip.id}>
                        <button
                          type="button"
                          onClick={() =>
                            onClipSelect(videoUrl, clip.id, startTime, endTime)
                          }
                          className={cn(
                            "group w-full flex items-center gap-3 p-2.5 rounded-app-md text-left",
                            "transition-all duration-150 border",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/40",
                            isSelected
                              ? "bg-white border-app-orange/30 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-white hover:border-app-border-input"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-app-sm text-[12px] font-semibold tabular-nums",
                              isSelected
                                ? "bg-app-orange text-white"
                                : "bg-app-active text-app-3"
                            )}
                          >
                            {idx + 1}
                          </span>

                          <div className="relative size-11 shrink-0 rounded-app-sm overflow-hidden bg-app-active border border-app-border-light">
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
                            <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Play className="size-3.5 text-white fill-white" />
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-[13px] font-medium tabular-nums",
                                isSelected ? "text-app-1" : "text-app-2"
                              )}
                            >
                              {formatDuration(startTime)} –{" "}
                              {formatDuration(endTime)}
                            </p>
                            <p className="text-[12px] text-app-4 mt-0.5">
                              {clipDurationLabel(startTime, endTime)} clip
                              {clipScore > 0 && (
                                <span className="text-app-3">
                                  {" "}
                                  · {clipScore}% match
                                </span>
                              )}
                            </p>
                          </div>

                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Download clip"
                            className={cn(
                              "shrink-0 p-2 rounded-app-sm text-app-4",
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
