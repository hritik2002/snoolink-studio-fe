"use client";

import { useEffect, useRef } from "react";
import { Toggle } from "@/components/app/Toggle";
import { cn } from "@/lib/utils";
import type { SearchSettings } from "@/lib/search-settings";

interface SearchSettingsPopoverProps {
  open: boolean;
  onClose: () => void;
  settings: SearchSettings;
  onChange: (settings: SearchSettings) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function SearchSettingsPopover({
  open,
  onClose,
  settings,
  onChange,
  anchorRef,
}: SearchSettingsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const thresholdPercent = Math.round(settings.minScore * 100);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Search settings"
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] z-[300] w-[280px]",
        "rounded-app-md border border-app-border bg-white shadow-app-dropdown",
        "p-4 animate-app-fade-up"
      )}
    >
      <p className="text-[13px] font-semibold text-app-1 mb-3">Search settings</p>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="search-threshold" className="text-[13px] font-medium text-app-2">
              Match threshold
            </label>
            <span className="text-[12px] font-medium tabular-nums text-app-orange">
              {thresholdPercent}%
            </span>
          </div>
          <input
            id="search-threshold"
            type="range"
            min={0}
            max={100}
            step={5}
            value={thresholdPercent}
            onChange={(e) =>
              onChange({
                ...settings,
                minScore: Number(e.target.value) / 100,
              })
            }
            className="w-full h-1.5 accent-app-orange cursor-pointer"
          />
          <p className="text-[11px] text-app-4 mt-1.5 leading-relaxed">
            Only return clips above this similarity score. Lower = more results.
          </p>
        </div>

        <div className="pt-3 border-t border-app-border-light">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-app-2">Expand query</p>
              <p className="text-[11px] text-app-4 mt-0.5 leading-relaxed">
                Enrich your search with AI before matching.
              </p>
            </div>
            <Toggle
              checked={settings.expandQuery}
              onChange={(expandQuery) => onChange({ ...settings, expandQuery })}
              className="shrink-0 mt-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
