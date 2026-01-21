"use client"

import { useState, useEffect, useCallback } from "react";
import { usePopupTrigger, PopupTrigger } from "@/lib/hooks/use-popup-triggers";
import {
  shouldShowPopup,
  markPopupDismissed,
  markSessionShown,
  incrementPopupShown,
  getPopupStorage,
} from "@/lib/hooks/use-popup-storage";
import { usePopupAnalytics } from "@/lib/hooks/use-popup-analytics";
import { EmailCapturePopup } from "./EmailCapturePopup";
import { LeadMagnetPopup } from "./LeadMagnetPopup";
import { DiscountPopup } from "./DiscountPopup";
import { ExitIntentPopup } from "./ExitIntentPopup";
import { useAuth } from "@/contexts/AuthContext";

export type PopupType =
  | "email-capture"
  | "lead-magnet"
  | "discount"
  | "exit-intent";

export interface PopupConfig {
  id: string;
  type: PopupType;
  trigger: PopupTrigger;
  enabled?: boolean;
  frequency?: {
    maxPerSession?: number;
    cooldownDays?: number;
    excludeConverted?: boolean;
    maxTotalShows?: number;
  };
  // Email capture props
  emailCapture?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    declineText?: string;
    placeholder?: string;
    incentive?: string;
    onSubmit?: (email: string) => Promise<void> | void;
  };
  // Lead magnet props
  leadMagnet?: {
    title: string;
    description: string;
    previewImage?: string;
    fileName?: string;
    headline?: string;
    ctaText?: string;
    declineText?: string;
    placeholder?: string;
    requireName?: boolean;
    onSubmit?: (email: string, name?: string) => Promise<void> | void;
  };
  // Discount props
  discount?: {
    discount: string;
    headline?: string;
    subheadline?: string;
    code?: string;
    deadline?: string;
    ctaText?: string;
    declineText?: string;
    placeholder?: string;
    requireEmail?: boolean;
    onSubmit?: (email: string) => Promise<void> | void;
  };
  // Exit intent props
  exitIntent?: {
    headline?: string;
    subheadline?: string;
    offer?: string;
    ctaText?: string;
    declineText?: string;
    placeholder?: string;
    requireEmail?: boolean;
    onSubmit?: (email: string) => Promise<void> | void;
  };
  // Targeting
  targeting?: {
    excludePages?: string[]; // URLs to exclude
    includePages?: string[]; // URLs to include (if specified, only show on these)
    excludeAuthenticated?: boolean; // Don't show to logged-in users
    onlyNewVisitors?: boolean; // Only show to first-time visitors
  };
}

interface PopupManagerProps {
  popups: PopupConfig[];
  currentPath?: string;
}

export function PopupManager({ popups, currentPath }: PopupManagerProps) {
  const [activePopup, setActivePopup] = useState<PopupConfig | null>(null);
  const [triggeredPopups, setTriggeredPopups] = useState<Set<string>>(
    new Set()
  );
  const { user } = useAuth();

  // Check if popup should be shown based on targeting rules
  const shouldShowBasedOnTargeting = useCallback(
    (config: PopupConfig): boolean => {
      const { targeting } = config;

      if (!targeting) return true;

      // Exclude authenticated users if specified
      if (targeting.excludeAuthenticated && user) {
        return false;
      }

      // Only show to new visitors if specified
      if (targeting.onlyNewVisitors) {
        const hasVisited = localStorage.getItem("has_visited_snoolink");
        if (hasVisited) return false;
        // Mark as visited
        localStorage.setItem("has_visited_snoolink", "true");
      }

      // Page targeting
      if (currentPath) {
        // Exclude pages
        if (targeting.excludePages) {
          for (const excludePath of targeting.excludePages) {
            if (currentPath.includes(excludePath)) {
              return false;
            }
          }
        }

        // Include pages (if specified, only show on these)
        if (targeting.includePages && targeting.includePages.length > 0) {
          const matches = targeting.includePages.some((includePath) =>
            currentPath.includes(includePath)
          );
          if (!matches) return false;
        }
      }

      return true;
    },
    [user, currentPath]
  );

  // Handle popup trigger
  const handleTrigger = useCallback(
    (config: PopupConfig) => {
      // Don't trigger if already triggered in this session
      if (triggeredPopups.has(config.id)) {
        return;
      }

      // Check frequency rules
      const frequency = config.frequency || {};
      if (
        !shouldShowPopup(config.id, {
          maxPerSession: frequency.maxPerSession,
          cooldownDays: frequency.cooldownDays,
          excludeConverted: frequency.excludeConverted,
          maxTotalShows: frequency.maxTotalShows,
        })
      ) {
        return;
      }

      // Check targeting rules
      if (!shouldShowBasedOnTargeting(config)) {
        return;
      }

      // Check if enabled
      if (config.enabled === false) {
        return;
      }

      // Show popup
      setActivePopup(config);
      markSessionShown(config.id);
      incrementPopupShown(config.id);
    },
    [triggeredPopups, shouldShowBasedOnTargeting]
  );

  // Handle popup close
  const handleClose = useCallback(
    (popupId: string) => {
      markPopupDismissed(popupId);
      setActivePopup(null);
      setTriggeredPopups((prev) => new Set(prev).add(popupId));
    },
    []
  );

  // Render popup based on type
  const renderPopup = () => {
    if (!activePopup) return null;

    const { id, type } = activePopup;

    switch (type) {
      case "email-capture":
        return (
          <EmailCapturePopup
            open={true}
            onClose={() => handleClose(id)}
            popupId={id}
            {...activePopup.emailCapture}
          />
        );

      case "lead-magnet":
        if (!activePopup.leadMagnet) return null;
        return (
          <LeadMagnetPopup
            open={true}
            onClose={() => handleClose(id)}
            popupId={id}
            {...activePopup.leadMagnet}
          />
        );

      case "discount":
        if (!activePopup.discount) return null;
        return (
          <DiscountPopup
            open={true}
            onClose={() => handleClose(id)}
            popupId={id}
            {...activePopup.discount}
          />
        );

      case "exit-intent":
        return (
          <ExitIntentPopup
            open={true}
            onClose={() => handleClose(id)}
            popupId={id}
            {...activePopup.exitIntent}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {popups.map((config) => {
        if (config.enabled === false) return null;
        if (triggeredPopups.has(config.id)) return null;

        return (
          <PopupTriggerHandler
            key={config.id}
            config={config}
            onTrigger={() => handleTrigger(config)}
            shouldCheckTargeting={shouldShowBasedOnTargeting(config)}
          />
        );
      })}
      {renderPopup()}
    </>
  );
}

// Component to handle individual popup triggers
function PopupTriggerHandler({
  config,
  onTrigger,
  shouldCheckTargeting,
}: {
  config: PopupConfig;
  onTrigger: () => void;
  shouldCheckTargeting: boolean;
}) {
  const [enabled, setEnabled] = useState(false);

  // Only enable trigger if targeting passes
  useEffect(() => {
    setEnabled(shouldCheckTargeting);
  }, [shouldCheckTargeting]);

  usePopupTrigger(config.trigger, enabled, onTrigger);

  return null;
}
