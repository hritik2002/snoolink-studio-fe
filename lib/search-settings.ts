export interface SearchSettings {
  minScore: number;
  expandQuery: boolean;
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  minScore: 0.5,
  expandQuery: true,
};

export const SEARCH_SETTINGS_STORAGE_KEY = "snoolink-search-settings";

export function loadSearchSettings(): SearchSettings {
  if (typeof window === "undefined") return DEFAULT_SEARCH_SETTINGS;
  try {
    const raw = localStorage.getItem(SEARCH_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SEARCH_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SearchSettings>;
    return {
      minScore:
        parsed.minScore != null && !Number.isNaN(parsed.minScore)
          ? Math.max(0, Math.min(1, parsed.minScore))
          : DEFAULT_SEARCH_SETTINGS.minScore,
      expandQuery: parsed.expandQuery ?? DEFAULT_SEARCH_SETTINGS.expandQuery,
    };
  } catch {
    return DEFAULT_SEARCH_SETTINGS;
  }
}

export function saveSearchSettings(settings: SearchSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEARCH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}
