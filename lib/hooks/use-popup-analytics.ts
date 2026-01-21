"use client"

/**
 * Analytics tracking for popup interactions
 * Tracks views, interactions, conversions, and dismissals
 */

export type PopupEventType =
  | "popup_view"
  | "popup_form_focus"
  | "popup_submit_attempt"
  | "popup_submit_success"
  | "popup_close_click"
  | "popup_outside_click"
  | "popup_escape_key"
  | "popup_decline_click";

export interface PopupEvent {
  popupId: string;
  eventType: PopupEventType;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Track popup event
 * Can be extended to send to analytics service (GA, Mixpanel, etc.)
 */
export function trackPopupEvent(
  popupId: string,
  eventType: PopupEventType,
  metadata?: Record<string, any>
): void {
  const event: PopupEvent = {
    popupId,
    eventType,
    timestamp: Date.now(),
    metadata,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Popup Analytics]", event);
  }

  // TODO: Integrate with your analytics service
  // Example: Google Analytics
  // if (typeof window !== "undefined" && (window as any).gtag) {
  //   (window as any).gtag("event", eventType, {
  //     popup_id: popupId,
  //     ...metadata,
  //   });
  // }

  // Example: Send to backend API
  // fetch("/api/analytics/popup", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(event),
  // }).catch(console.error);
}

/**
 * React hook for popup analytics
 */
export function usePopupAnalytics(popupId: string) {
  return {
    trackView: () => trackPopupEvent(popupId, "popup_view"),
    trackFormFocus: () => trackPopupEvent(popupId, "popup_form_focus"),
    trackSubmitAttempt: () => trackPopupEvent(popupId, "popup_submit_attempt"),
    trackSubmitSuccess: (metadata?: Record<string, any>) =>
      trackPopupEvent(popupId, "popup_submit_success", metadata),
    trackClose: (method: "button" | "outside" | "escape") => {
      if (method === "button") {
        trackPopupEvent(popupId, "popup_close_click");
      } else if (method === "outside") {
        trackPopupEvent(popupId, "popup_outside_click");
      } else {
        trackPopupEvent(popupId, "popup_escape_key");
      }
    },
    trackDecline: () => trackPopupEvent(popupId, "popup_decline_click"),
  };
}
