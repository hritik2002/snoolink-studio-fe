"use client";

import { useState } from "react";
import { X, Sparkles, CloudUpload, Search, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useRouter } from "next/navigation";

export function WelcomeModal() {
  const { onboardingState, dismissOnboarding } = useOnboarding();
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  if (onboardingState.dismissed || onboardingState.isComplete) {
    return null;
  }

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      dismissOnboarding();
    }, 200);
  };

  const handleGetStarted = () => {
    handleDismiss();
    router.push("/?view=uploads");
  };

  const completedCount =
    (onboardingState.hasUploaded ? 1 : 0) +
    (onboardingState.hasSearched ? 1 : 0) +
    (onboardingState.hasCreatedCollection ? 1 : 0);
  const totalCount = 3;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-200 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleDismiss}
    >
      <Card
        className={`w-full max-w-lg bg-card-2xl rounded-none overflow-hidden transition-transform duration-200 ${
          isClosing ? "scale-95" : "scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 sm:p-8">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary mb-4 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to Snoolink!
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Let's get you set up in 2 minutes. Upload your media, and we'll make it searchable by meaning.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span className="font-semibold">
                {completedCount} of {totalCount} complete
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3 mb-6">
            <ChecklistItem
              completed={onboardingState.hasUploaded}
              icon={<CloudUpload className="h-5 w-5" />}
              title="Upload your first media"
              description="Start building your searchable library"
              time="2 min"
              onClick={handleGetStarted}
            />
            <ChecklistItem
              completed={onboardingState.hasSearched}
              icon={<Search className="h-5 w-5" />}
              title="Try your first search"
              description="Experience AI-powered semantic search"
              time="30 sec"
              onClick={() => {
                handleDismiss();
                router.push("/?view=search");
              }}
            />
            <ChecklistItem
              completed={onboardingState.hasCreatedCollection}
              icon={<CheckCircle2 className="h-5 w-5" />}
              title="Create your first collection"
              description="Organize your media into groups"
              time="1 min"
              optional
              onClick={() => {
                handleDismiss();
                router.push("/?view=collections");
              }}
            />
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGetStarted}
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-white"
              size="lg"
            >
              Get Started
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              I'll do this later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ChecklistItemProps {
  completed: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  optional?: boolean;
  onClick: () => void;
}

function ChecklistItem({
  completed,
  icon,
  title,
  description,
  time,
  optional,
  onClick,
}: ChecklistItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={completed}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
        completed
          ? "bg-green-50 border-green-200 cursor-default"
          : "bg-card border-border hover:border-primary/30 hover:shadow-md cursor-pointer"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            completed
              ? "bg-green-100 text-green-600"
              : "bg-primary/10 text-primary"
          }`}
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold text-sm ${
                completed ? "text-green-900 line-through" : "text-foreground"
              }`}
            >
              {title}
            </h3>
            {optional && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>
          <p
            className={`text-xs ${
              completed ? "text-green-700" : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">~{time}</p>
        </div>
      </div>
    </button>
  );
}
