"use client"

import { useEffect, useState, useRef, useCallback } from "react";

export type PopupTrigger =
  | { type: "time"; delay: number } // milliseconds
  | { type: "scroll"; percentage: number } // 0-100
  | { type: "exit-intent" }
  | { type: "click"; elementId?: string } // element ID to watch for clicks
  | { type: "page-count"; count: number } // after X page views
  | { type: "manual" }; // triggered programmatically

export interface TriggerState {
  shouldShow: boolean;
  triggerType: PopupTrigger["type"] | null;
}

/**
 * Hook to detect exit intent (mouse leaving viewport)
 */
export function useExitIntent(
  enabled: boolean,
  onTrigger: () => void
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward (toward address bar/close button)
      if (e.clientY <= 0) {
        onTrigger();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [enabled, onTrigger]);
}

/**
 * Hook to detect scroll depth
 */
export function useScrollDepth(
  percentage: number,
  enabled: boolean,
  onTrigger: () => void
): void {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || triggered) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollPercentage =
        (scrollTop / (documentHeight - windowHeight)) * 100;

      if (scrollPercentage >= percentage && !triggered) {
        setTriggered(true);
        onTrigger();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [percentage, enabled, triggered, onTrigger]);
}

/**
 * Hook to detect time-based trigger
 */
export function useTimeTrigger(
  delay: number,
  enabled: boolean,
  onTrigger: () => void
): void {
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      onTrigger();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled, onTrigger]);
}

/**
 * Hook to detect click on specific element
 */
export function useClickTrigger(
  elementId: string | undefined,
  enabled: boolean,
  onTrigger: () => void
): void {
  useEffect(() => {
    if (!enabled || !elementId) return;

    const element = document.getElementById(elementId);
    if (!element) return;

    const handleClick = () => {
      onTrigger();
    };

    element.addEventListener("click", handleClick);

    return () => {
      element.removeEventListener("click", handleClick);
    };
  }, [elementId, enabled, onTrigger]);
}

/**
 * Hook to track page count
 */
export function usePageCount(
  targetCount: number,
  enabled: boolean,
  onTrigger: () => void
): void {
  const pageCountRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Increment page count on mount
    pageCountRef.current += 1;

    if (pageCountRef.current >= targetCount) {
      onTrigger();
    }
  }, [targetCount, enabled, onTrigger]);
}

/**
 * Main hook to handle popup triggers
 */
export function usePopupTrigger(
  trigger: PopupTrigger,
  enabled: boolean,
  onTrigger: () => void
): void {
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleTrigger = useCallback(() => {
    if (!hasTriggered) {
      setHasTriggered(true);
      onTrigger();
    }
  }, [hasTriggered, onTrigger]);

  // Time-based trigger
  useTimeTrigger(
    trigger.type === "time" ? trigger.delay : 0,
    enabled && trigger.type === "time" && !hasTriggered,
    handleTrigger
  );

  // Scroll-based trigger
  useScrollDepth(
    trigger.type === "scroll" ? trigger.percentage : 0,
    enabled && trigger.type === "scroll" && !hasTriggered,
    handleTrigger
  );

  // Exit intent trigger
  useExitIntent(
    enabled && trigger.type === "exit-intent" && !hasTriggered,
    handleTrigger
  );

  // Click trigger
  useClickTrigger(
    trigger.type === "click" ? trigger.elementId : undefined,
    enabled && trigger.type === "click" && !hasTriggered,
    handleTrigger
  );

  // Page count trigger
  usePageCount(
    trigger.type === "page-count" ? trigger.count : 0,
    enabled && trigger.type === "page-count" && !hasTriggered,
    handleTrigger
  );

  // Manual trigger - no automatic handling needed
}
