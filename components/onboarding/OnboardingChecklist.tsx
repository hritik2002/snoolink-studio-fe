"use client";

import { CloudUpload, Search, FolderPlus, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function OnboardingChecklist() {
  const { onboardingState, refreshState, dismissOnboarding, loading } = useOnboarding();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Mark as initialized once loading is complete
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure state has settled
      const timer = setTimeout(() => setIsInitialized(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Determine if modal should be open
  useEffect(() => {
    if (!loading && isInitialized) {
      // Only show if not dismissed, not complete, and user hasn't uploaded
      const shouldShow = !onboardingState.dismissed && 
                        !onboardingState.isComplete && 
                        !onboardingState.hasUploaded;
      setIsOpen(shouldShow);
    }
  }, [loading, isInitialized, onboardingState.dismissed, onboardingState.isComplete, onboardingState.hasUploaded]);

  // Don't render anything if dismissed, complete, or user has uploaded
  if (!loading && isInitialized && (onboardingState.dismissed || onboardingState.isComplete || onboardingState.hasUploaded)) {
    return null;
  }

  // Don't show skeleton if we already know user has uploaded
  if (loading || !isInitialized) {
    if (!loading && onboardingState.hasUploaded) {
      return null;
    }
    // Return null during loading to prevent layout shift
    return null;
  }

  const completedCount =
    (onboardingState.hasUploaded ? 1 : 0) +
    (onboardingState.hasSearched ? 1 : 0) +
    (onboardingState.hasCreatedCollection ? 1 : 0);
  const totalCount = 3;
  const progress = (completedCount / totalCount) * 100;

  const handleClose = () => {
    setIsOpen(false);
    dismissOnboarding();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-none border border-[rgba(51,51,51,0.5)] bg-[#050505] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-white text-left">
            Get started
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#71717a] text-left pt-1">
            Upload, search, organize.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6 mt-4">
          <div className="flex items-center justify-between text-[13px] text-[#71717a] mb-2">
            <span>Progress</span>
            <span className="font-mono-beetle text-primary">{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full h-1 bg-[#333333] overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <ChecklistItem
            completed={onboardingState.hasUploaded}
            icon={<CloudUpload className="h-4 w-4" />}
            title="Upload media"
            onClick={async () => {
              handleClose();
              router.push("/?view=uploads");
              await refreshState();
            }}
          />
          <ChecklistItem
            completed={onboardingState.hasSearched}
            icon={<Search className="h-4 w-4" />}
            title="Run a search"
            onClick={async () => {
              handleClose();
              router.push("/?view=search");
              await refreshState();
            }}
          />
          <ChecklistItem
            completed={onboardingState.hasCreatedCollection}
            icon={<FolderPlus className="h-4 w-4" />}
            title="Create a collection"
            optional
            onClick={async () => {
              handleClose();
              router.push("/?view=collections");
              await refreshState();
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="beetle"
            onClick={() => {
              handleClose();
              router.push("/?view=uploads");
            }}
            className="flex-1"
          >
            Upload
          </Button>
          <Button
            onClick={handleClose}
            variant="beetle-tertiary"
            className="flex-1"
          >
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChecklistItemProps {
  completed: boolean;
  icon: React.ReactNode;
  title: string;
  description?: string;
  optional?: boolean;
  onClick: () => void;
}

function ChecklistItem({
  completed,
  icon,
  title,
  optional,
  onClick,
}: ChecklistItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={completed}
      className={cn(
        "w-full text-left p-3 border transition-colors duration-150",
        completed
          ? "border-primary/30 bg-primary/5 cursor-default"
          : "border-[rgba(51,51,51,0.5)] hover:border-primary/40 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "shrink-0 w-8 h-8 flex items-center justify-center border",
            completed
              ? "border-primary/40 text-primary bg-primary/10"
              : "border-[rgba(51,51,51,0.5)] text-white/60"
          )}
        >
          {completed ? <CheckCircle2 className="h-4 w-4" /> : icon}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn("text-sm", completed ? "text-primary line-through" : "text-white/80")}>
            {title}
          </span>
          {optional && !completed && (
            <span className="nav-badge">Optional</span>
          )}
        </div>
      </div>
    </button>
  );
}
