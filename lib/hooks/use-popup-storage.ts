"use client"

/**
 * Utilities for managing popup frequency capping and user preferences
 * Uses localStorage to remember dismissals and prevent annoying users
 */

export interface PopupStorage {
  dismissedAt: number | null;
  shownCount: number;
  lastShownAt: number | null;
  converted: boolean;
}

const STORAGE_PREFIX = "snoolink_popup_";

/**
 * Get storage key for a specific popup
 */
function getStorageKey(popupId: string): string {
  return `${STORAGE_PREFIX}${popupId}`;
}

/**
 * Get popup storage data
 */
export function getPopupStorage(popupId: string): PopupStorage {
  if (typeof window === "undefined") {
    return {
      dismissedAt: null,
      shownCount: 0,
      lastShownAt: null,
      converted: false,
    };
  }

  try {
    const stored = localStorage.getItem(getStorageKey(popupId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error reading popup storage:", error);
  }

  return {
    dismissedAt: null,
    shownCount: 0,
    lastShownAt: null,
    converted: false,
  };
}

/**
 * Save popup storage data
 */
export function setPopupStorage(popupId: string, data: Partial<PopupStorage>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getPopupStorage(popupId);
    const updated = { ...existing, ...data };
    localStorage.setItem(getStorageKey(popupId), JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving popup storage:", error);
  }
}

/**
 * Mark popup as dismissed
 */
export function markPopupDismissed(popupId: string): void {
  setPopupStorage(popupId, {
    dismissedAt: Date.now(),
    shownCount: getPopupStorage(popupId).shownCount + 1,
    lastShownAt: Date.now(),
  });
}

/**
 * Mark popup as converted (user submitted)
 */
export function markPopupConverted(popupId: string): void {
  setPopupStorage(popupId, {
    converted: true,
    lastShownAt: Date.now(),
  });
}

/**
 * Increment shown count
 */
export function incrementPopupShown(popupId: string): void {
  const existing = getPopupStorage(popupId);
  setPopupStorage(popupId, {
    shownCount: existing.shownCount + 1,
    lastShownAt: Date.now(),
  });
}

/**
 * Check if popup should be shown based on frequency rules
 */
export function shouldShowPopup(
  popupId: string,
  options: {
    maxPerSession?: number;
    cooldownDays?: number;
    excludeConverted?: boolean;
    maxTotalShows?: number;
  } = {}
): boolean {
  const {
    maxPerSession = 1,
    cooldownDays = 7,
    excludeConverted = true,
    maxTotalShows,
  } = options;

  const storage = getPopupStorage(popupId);

  // Don't show if already converted and we exclude converted
  if (excludeConverted && storage.converted) {
    return false;
  }

  // Check total show limit
  if (maxTotalShows && storage.shownCount >= maxTotalShows) {
    return false;
  }

  // Check cooldown period
  if (storage.dismissedAt) {
    const daysSinceDismissal =
      (Date.now() - storage.dismissedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissal < cooldownDays) {
      return false;
    }
  }

  // Check session limit (using sessionStorage)
  if (typeof window !== "undefined") {
    const sessionKey = `session_${popupId}`;
    const sessionCount = parseInt(
      sessionStorage.getItem(sessionKey) || "0",
      10
    );
    if (sessionCount >= maxPerSession) {
      return false;
    }
  }

  return true;
}

/**
 * Mark popup as shown in current session
 */
export function markSessionShown(popupId: string): void {
  if (typeof window === "undefined") return;

  const sessionKey = `session_${popupId}`;
  const current = parseInt(sessionStorage.getItem(sessionKey) || "0", 10);
  sessionStorage.setItem(sessionKey, String(current + 1));
}

/**
 * Clear all popup storage (useful for testing)
 */
export function clearAllPopupStorage(): void {
  if (typeof window === "undefined") return;

  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}
