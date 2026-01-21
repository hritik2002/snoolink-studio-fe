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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-3 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to Snoolink Studio!
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Let's get you set up in 2 minutes. Complete these steps to unlock the full power of semantic search.
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-semibold text-purple-600">
              {completedCount} of {totalCount} complete
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-3 mb-6">
          <ChecklistItem
            completed={onboardingState.hasUploaded}
            icon={<CloudUpload className="h-5 w-5" />}
            title="Upload your first media"
            description="Start building your searchable library"
            onClick={async () => {
              handleClose();
              router.push("/?view=uploads");
              await refreshState();
            }}
          />
          <ChecklistItem
            completed={onboardingState.hasSearched}
            icon={<Search className="h-5 w-5" />}
            title="Try your first search"
            description="Experience AI-powered semantic search"
            onClick={async () => {
              handleClose();
              router.push("/?view=search");
              await refreshState();
            }}
          />
          <ChecklistItem
            completed={onboardingState.hasCreatedCollection}
            icon={<FolderPlus className="h-5 w-5" />}
            title="Create your first collection"
            description="Organize your media into groups"
            optional
            onClick={async () => {
              handleClose();
              router.push("/?view=collections");
              await refreshState();
            }}
          />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => {
              handleClose();
              router.push("/?view=uploads");
            }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            size="lg"
          >
            Get Started
          </Button>
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            I'll do this later
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
  description: string;
  optional?: boolean;
  onClick: () => void;
}

function ChecklistItem({
  completed,
  icon,
  title,
  description,
  optional,
  onClick,
}: ChecklistItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={completed}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
        completed
          ? "bg-green-50 border-green-200 cursor-default"
          : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-md cursor-pointer active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            completed
              ? "bg-green-100 text-green-600"
              : "bg-purple-100 text-purple-600"
          )}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                "text-base font-semibold",
                completed ? "text-green-900 line-through" : "text-gray-900"
              )}
            >
              {title}
            </h4>
            {optional && !completed && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>
          <p
            className={cn(
              "text-sm",
              completed ? "text-green-700" : "text-gray-600"
            )}
          >
            {description}
          </p>
        </div>
        {!completed && (
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Start →
          </Button>
        )}
      </div>
    </button>
  );
}
