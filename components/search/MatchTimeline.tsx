"use client";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/file-format";

export interface TimelineSegment {
  id: string;
  start: number;
  end: number;
  score: number;
}

interface MatchTimelineProps {
  duration: number;
  segments: TimelineSegment[];
  selectedId?: string;
  onSelect: (id: string, start: number, end: number) => void;
}

function tickTimes(duration: number): number[] {
  if (duration <= 0) return [0];
  const count = 5;
  return Array.from({ length: count }, (_, i) => (duration * i) / (count - 1));
}

export function MatchTimeline({
  duration,
  segments,
  selectedId,
  onSelect,
}: MatchTimelineProps) {
  if (duration <= 0) return null;

  const ticks = tickTimes(duration);
  const selected = segments.find((s) => s.id === selectedId);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-app-4 tabular-nums">
        <span>Timeline</span>
        {selected && (
          <span className="text-app-orange font-medium">
            {formatDuration(selected.start)} – {formatDuration(selected.end)}
          </span>
        )}
      </div>

      <div className="relative pt-1 pb-5">
        {/* Tick labels */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between pointer-events-none">
          {ticks.map((t, i) => (
            <span
              key={i}
              className="text-[10px] text-app-4 tabular-nums w-8 text-center first:text-left last:text-right"
            >
              {formatDuration(t)}
            </span>
          ))}
        </div>

        {/* Track */}
        <div
          className="relative h-5 rounded-app-sm bg-white border border-app-border-input px-1"
          role="group"
          aria-label="Video match timeline"
        >
          <div className="relative h-full rounded-[3px] bg-app-active overflow-hidden">
            {segments.map((segment, idx) => {
              const left = (segment.start / duration) * 100;
              const width = ((segment.end - segment.start) / duration) * 100;
              const isSelected = selectedId === segment.id;

              return (
                <button
                  key={segment.id}
                  type="button"
                  title={`Moment ${idx + 1}: ${formatDuration(segment.start)} – ${formatDuration(segment.end)}`}
                  aria-label={`Moment ${idx + 1} at ${formatDuration(segment.start)}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "absolute top-0 bottom-0 min-w-[4px] transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/60 focus-visible:z-30",
                    isSelected
                      ? "bg-app-orange z-20"
                      : "bg-app-1/75 hover:bg-app-orange/85 z-10"
                  )}
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 0.8)}%`,
                  }}
                  onClick={() => onSelect(segment.id, segment.start, segment.end)}
                />
              );
            })}

            {selected && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.25)] z-30 pointer-events-none"
                style={{ left: `${(selected.start / duration) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
