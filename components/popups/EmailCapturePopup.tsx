"use client"

import { useState, FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Mail, Sparkles, ArrowRight } from "lucide-react";
import { usePopupAnalytics } from "@/lib/hooks/use-popup-analytics";
import { markPopupConverted } from "@/lib/hooks/use-popup-storage";
import { cn } from "@/lib/utils";

export interface EmailCapturePopupProps {
  open: boolean;
  onClose: () => void;
  popupId: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  declineText?: string;
  placeholder?: string;
  onSubmit?: (email: string) => Promise<void> | void;
  incentive?: string; // e.g., "10% off", "Free guide"
}

export function EmailCapturePopup({
  open,
  onClose,
  popupId,
  headline = "Get Weekly Tips & Updates",
  subheadline = "Join thousands of creators getting the latest AI-powered search insights delivered to their inbox.",
  ctaText = "Subscribe Now",
  declineText = "No thanks",
  placeholder = "Enter your email",
  onSubmit,
  incentive,
}: EmailCapturePopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const analytics = usePopupAnalytics(popupId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    analytics.trackSubmitAttempt();

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Default: just log (you can replace with API call)
        console.log("Email submitted:", email);
      }

      analytics.trackSubmitSuccess({ email });
      markPopupConverted(popupId);
      setEmail("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (method: "button" | "outside" | "escape") => {
    analytics.trackClose(method);
    onClose();
  };

  const handleDecline = () => {
    analytics.trackDecline();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose("button")}>
      <DialogContent
        className={cn(
          "sm:max-w-lg border-0 p-0 overflow-hidden",
          "bg-gradient-to-br from-[var(--popup-surface)] via-[var(--popup-surface)] to-[var(--popup-surface-dark)]",
          "dark:from-[var(--popup-surface-dark)] dark:via-[var(--popup-surface)] dark:to-[var(--popup-surface-dark)]",
          "popup-animate-enter"
        )}
        onEscapeKeyDown={() => handleClose("escape")}
        onPointerDownOutside={() => handleClose("outside")}
      >
        {/* Atmospheric background pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 popup-gradient-bg mix-blend-multiply dark:mix-blend-soft-light" />
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, var(--popup-accent-1) 0%, transparent 50%),
                                radial-gradient(circle at 80% 80%, var(--popup-accent-2) 0%, transparent 50%),
                                radial-gradient(circle at 40% 20%, var(--popup-accent-3) 0%, transparent 50%)`,
              backgroundSize: "200% 200%",
              animation: "popup-gradient-shift 12s ease infinite",
            }}
          />
        </div>

        {/* Close button with custom styling */}
        <button
          onClick={() => handleClose("button")}
          className={cn(
            "absolute right-4 top-4 z-50 rounded-full p-2",
            "bg-white/80 dark:bg-black/40 backdrop-blur-sm",
            "border border-white/20 dark:border-white/10",
            "hover:bg-white dark:hover:bg-black/60",
            "transition-all duration-200",
            "popup-animate-stagger-3"
          )}
        >
          <X className="h-4 w-4 text-foreground" />
          <span className="sr-only">Close</span>
        </button>

        <div className="relative z-10 p-8 sm:p-10">
          <DialogHeader className="space-y-4">
            {/* Icon with floating animation */}
            <div className="flex items-center justify-center mb-2 popup-animate-stagger-1">
              <div className={cn(
                "relative rounded-2xl p-4",
                "bg-gradient-to-br from-[var(--popup-accent-1)] to-[var(--popup-accent-2)]",
                "popup-float popup-glow-effect"
              )}>
                <Mail className="h-8 w-8 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
              </div>
            </div>

            <DialogTitle className={cn(
              "text-center text-3xl sm:text-4xl font-bold",
              "font-[var(--popup-font)]",
              "popup-shimmer-text",
              "popup-animate-stagger-1"
            )}>
              {headline}
            </DialogTitle>

            <DialogDescription className={cn(
              "text-center text-base sm:text-lg",
              "text-muted-foreground",
              "font-[var(--popup-font)] font-medium",
              "leading-relaxed",
              "popup-animate-stagger-2"
            )}>
              {subheadline}
            </DialogDescription>

            {incentive && (
              <div className={cn(
                "flex items-center justify-center gap-2 mt-2",
                "px-4 py-2 rounded-full",
                "bg-gradient-to-r from-[var(--popup-accent-1)]/20 to-[var(--popup-accent-2)]/20",
                "border border-[var(--popup-accent-1)]/30",
                "backdrop-blur-sm",
                "popup-animate-stagger-2"
              )}>
                <Sparkles className="h-4 w-4 text-[var(--popup-accent-1)]" />
                <span className={cn(
                  "text-sm font-semibold",
                  "font-[var(--popup-font)]",
                  "text-[var(--popup-accent-1)]"
                )}>
                  {incentive}
                </span>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8 popup-animate-stagger-3">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="email"
                  placeholder={placeholder}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  onFocus={() => analytics.trackFormFocus()}
                  disabled={isSubmitting}
                  className={cn(
                    "h-14 text-base",
                    "bg-white/60 dark:bg-black/40",
                    "backdrop-blur-sm",
                    "border-2 border-[var(--popup-accent-1)]/20",
                    "focus:border-[var(--popup-accent-1)]",
                    "focus:ring-2 focus:ring-[var(--popup-accent-1)]/20",
                    "transition-all duration-300",
                    "font-[var(--popup-font)]",
                    "placeholder:text-muted-foreground/60"
                  )}
                  autoFocus
                />
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 pointer-events-none" />
              </div>
              {error && (
                <p className="text-sm text-destructive font-[var(--popup-font)] animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className={cn(
                  "w-full h-14 text-base font-semibold",
                  "bg-gradient-to-r from-[var(--popup-accent-1)] to-[var(--popup-accent-2)]",
                  "hover:from-[var(--popup-accent-2)] hover:to-[var(--popup-accent-3)]",
                  "text-white border-0",
                  "shadow-lg shadow-[var(--popup-accent-1)]/30",
                  "hover:shadow-xl hover:shadow-[var(--popup-accent-2)]/40",
                  "transition-all duration-300",
                  "font-[var(--popup-font)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "relative overflow-hidden group"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      {ctaText}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDecline}
                className={cn(
                  "w-full text-sm",
                  "text-muted-foreground hover:text-foreground",
                  "hover:bg-white/10 dark:hover:bg-black/20",
                  "font-[var(--popup-font)]",
                  "transition-colors duration-200"
                )}
              >
                {declineText}
              </Button>
            </div>
          </form>

          <p className={cn(
            "text-xs text-center text-muted-foreground mt-6",
            "font-[var(--popup-font)]",
            "popup-animate-stagger-3"
          )}>
            No spam, unsubscribe anytime.{" "}
            <a 
              href="/privacy" 
              className="underline hover:text-[var(--popup-accent-1)] transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
