"use client";

import {
  SearchResultCard,
  type VideoSearchResults,
} from "./SearchResultCard";

export type { VideoSearchResults };

interface SearchResultsListProps {
  results: VideoSearchResults;
  searchQuery: string;
  selectedClips: Record<string, string>;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  onClipSelect: (
    videoUrl: string,
    clipId: string,
    startTime: number,
    endTime: number
  ) => void;
  onDownload: (videoUrl: string, startTime: number, endTime: number) => void;
}

export function SearchResultsList({
  results,
  searchQuery,
  selectedClips,
  videoRefs,
  onClipSelect,
  onDownload,
}: SearchResultsListProps) {
  const resultCount = Object.keys(results).length;
  const totalMoments = Object.values(results).reduce(
    (sum, r) => sum + (r.clips?.length ?? 0),
    0
  );

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4 px-1 border-b border-app-border-light shrink-0">
        <div>
          <p className="text-[14px] text-app-2">
            <span className="font-semibold text-app-1 tabular-nums">
              {resultCount}
            </span>{" "}
            {resultCount === 1 ? "video" : "videos"}
            {totalMoments > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums">{totalMoments}</span>{" "}
                {totalMoments === 1 ? "moment" : "moments"}
              </>
            )}
          </p>
          {searchQuery.trim() && (
            <p className="text-[13px] text-app-4 mt-0.5 truncate max-w-prose">
              for &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 py-4 sm:py-5">
        {Object.entries(results).map(([videoUrl, videoResult]) => {
          const clips = videoResult.clips || [];
          const selectedClipId =
            selectedClips[videoUrl] ?? clips[0]?.id;

          return (
            <SearchResultCard
              key={videoUrl}
              result={videoResult}
              selectedClipId={selectedClipId}
              onClipSelect={onClipSelect}
              onDownload={onDownload}
              videoRef={(video) => {
                if (video) {
                  video.setAttribute("webkit-playsinline", "true");
                  videoRefs.current[videoUrl] = video;
                } else {
                  delete videoRefs.current[videoUrl];
                }
              }}
              onVideoLoaded={(video) => {
                const clipId = selectedClips[videoUrl] ?? clips[0]?.id;
                if (!clipId || clips.length === 0) return;
                const clip = clips.find((c) => c.id === clipId) ?? clips[0];
                if (!clip) return;
                const startTime = parseFloat(clip.startTime);
                if (startTime >= 0 && startTime < video.duration) {
                  video.currentTime = startTime;
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
