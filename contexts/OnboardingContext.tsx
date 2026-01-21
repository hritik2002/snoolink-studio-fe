"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

interface OnboardingState {
  hasUploaded: boolean;
  hasSearched: boolean;
  hasCreatedCollection: boolean;
  isComplete: boolean;
  dismissed: boolean;
}

interface OnboardingContextType {
  onboardingState: OnboardingState;
  loading: boolean;
  refreshState: () => Promise<void>;
  dismissOnboarding: () => void;
  markComplete: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Initialize state by checking localStorage synchronously to prevent layout shift
  const getInitialState = (): OnboardingState => {
    if (typeof window === "undefined") {
      return {
        hasUploaded: false,
        hasSearched: false,
        hasCreatedCollection: false,
        isComplete: false,
        dismissed: false,
      };
    }
    
    // Check localStorage synchronously if user is available
    if (user?.id) {
      const dismissedKey = `onboarding_dismissed_${user.id}`;
      const dismissed = localStorage.getItem(dismissedKey) === "true";
      
      return {
        hasUploaded: false,
        hasSearched: false,
        hasCreatedCollection: false,
        isComplete: false,
        dismissed,
      };
    }
    
    return {
      hasUploaded: false,
      hasSearched: false,
      hasCreatedCollection: false,
      isComplete: false,
      dismissed: false,
    };
  };

  const [onboardingState, setOnboardingState] = useState<OnboardingState>(getInitialState);
  // If already dismissed, we don't need to load
  const [loading, setLoading] = useState(() => {
    const initialState = getInitialState();
    // If dismissed, no need to load
    return !initialState.dismissed;
  });

  // Update dismissed state when user becomes available
  // Also check if user has uploaded media (if so, keep checklist hidden)
  useEffect(() => {
    if (user?.id && typeof window !== "undefined") {
      const dismissedKey = `onboarding_dismissed_${user.id}`;
      const dismissed = localStorage.getItem(dismissedKey) === "true";
      if (dismissed && !onboardingState.dismissed) {
        setOnboardingState((prev) => ({ ...prev, dismissed: true }));
        setLoading(false);
      }
    }
  }, [user, onboardingState.dismissed]);
  
  // Auto-dismiss if user has uploaded media (check this after state loads)
  useEffect(() => {
    if (!loading && onboardingState.hasUploaded && !onboardingState.dismissed) {
      // User has uploaded media, so we can consider onboarding "complete" for display purposes
      // We don't set dismissed=true here, but the component will hide based on hasUploaded
    }
  }, [loading, onboardingState.hasUploaded, onboardingState.dismissed]);

  const checkOnboardingState = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Double-check localStorage (should already be set in initial state, but just in case)
    const dismissedKey = `onboarding_dismissed_${user.id}`;
    const dismissed = localStorage.getItem(dismissedKey) === "true";
    
    if (dismissed) {
      setOnboardingState((prev) => ({ ...prev, dismissed: true }));
      setLoading(false);
      return;
    }

    try {

      // Fetch user analytics to check if they've uploaded/searched
      const response = await fetch("/api/analytics/overview");
      if (response.ok) {
        const data = await response.json();
        const overview = data.data;

        const hasUploaded =
          (overview?.uploads?.images ?? 0) > 0 || (overview?.uploads?.videos ?? 0) > 0;
        const hasSearched = (overview?.searches ?? 0) > 0;
        const hasCreatedCollection = (overview?.collectionsCreated ?? 0) > 0;
        const isComplete = hasUploaded && hasSearched;

        setOnboardingState({
          hasUploaded,
          hasSearched,
          hasCreatedCollection,
          isComplete,
          dismissed,
        });
      } else {
        // If API fails, check localStorage for completion
        const completedKey = `onboarding_completed_${user.id}`;
        const completed = localStorage.getItem(completedKey) === "true";
        
        setOnboardingState({
          hasUploaded: false,
          hasSearched: false,
          hasCreatedCollection: false,
          isComplete: completed,
          dismissed,
        });
      }
    } catch (error) {
      console.error("Error checking onboarding state:", error);
      setOnboardingState((prev) => ({ ...prev, dismissed }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Only check if not already dismissed (to avoid unnecessary API calls)
    if (!onboardingState.dismissed) {
      checkOnboardingState();
    }
  }, [checkOnboardingState, onboardingState.dismissed]);

  const refreshState = useCallback(async () => {
    setLoading(true);
    await checkOnboardingState();
  }, [checkOnboardingState]);

  const dismissOnboarding = useCallback(() => {
    if (!user) return;
    const dismissedKey = `onboarding_dismissed_${user.id}`;
    localStorage.setItem(dismissedKey, "true");
    setOnboardingState((prev) => ({ ...prev, dismissed: true }));
  }, [user]);

  const markComplete = useCallback(() => {
    if (!user) return;
    const completedKey = `onboarding_completed_${user.id}`;
    localStorage.setItem(completedKey, "true");
    setOnboardingState((prev) => ({ ...prev, isComplete: true }));
  }, [user]);

  return (
    <OnboardingContext.Provider
      value={{
        onboardingState,
        loading,
        refreshState,
        dismissOnboarding,
        markComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
