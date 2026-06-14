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
import { AlertCircle, Mail, ArrowRight, X, Zap } from "lucide-react";
import { usePopupAnalytics } from "@/lib/hooks/use-popup-analytics";
import { markPopupConverted } from "@/lib/hooks/use-popup-storage";
import { cn } from "@/lib/utils";

export interface ExitIntentPopupProps {
  open: boolean;
  onClose: () => void;
  popupId: string;
  headline?: string;
  subheadline?: string;
  offer?: string; // e.g., "Get 10% off", "Download free guide"
  ctaText?: string;
  declineText?: string;
  placeholder?: string;
  onSubmit?: (email: string) => Promise<void> | void;
  requireEmail?: boolean;
}

export function ExitIntentPopup({
  open,
  onClose,
  popupId,
  headline = "Wait! Before you go...",
  subheadline = "Don't miss out on exclusive content and updates.",
  offer,
  ctaText = "Stay Connected",
  declineText = "No thanks, I'll pass",
  placeholder = "Enter your email",
  onSubmit,
  requireEmail = true,
}: ExitIntentPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const analytics = usePopupAnalytics(popupId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!requireEmail) {
      markPopupConverted(popupId);
      onClose();
      return;
    }

    setError("");

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
        console.log("Exit intent captured:", email);
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
          "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100",
          "dark:from-amber-950/50 dark:via-orange-950/30 dark:to-amber-900/40",
          "popup-animate-enter"
        )}
        onEscapeKeyDown={() => handleClose("escape")}
        onPointerDownOutside={() => handleClose("outside")}
      >
        {/* Dynamic background with energy */}
        <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 30% 30%, oklch(0.75 0.15 60) 0%, transparent 40%),
                                radial-gradient(circle at 70% 70%, oklch(0.80 0.18 45) 0%, transparent 40%),
                                repeating-linear-gradient(45deg, transparent, transparent 2px, oklch(0.85 0.10 55 / 0.03) 2px, oklch(0.85 0.10 55 / 0.03) 4px)`,
            }}
          />
        </div>

        {/* Animated border glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: "inset 0 0 60px oklch(0.75 0.20 55 / 0.3), 0 0 80px oklch(0.80 0.25 50 / 0.2)",
            animation: "glow-pulse 4s ease-in-out infinite",
          }}
        />

        <button
          onClick={() => handleClose("button")}
          className={cn(
            "absolute right-4 top-4 z-50 rounded-full p-2",
            "bg-white/90 dark:bg-black/50 backdrop-blur-sm",
            "border border-amber-200/50 dark:border-amber-800/30",
            "hover:bg-primary/10 dark:hover:bg-black/70",
            "transition-all duration-200",
            "popup-animate-stagger-3"
          )}
        >
          <X className="h-4 w-4 text-foreground" />
          <span className="sr-only">Close</span>
        </button>

        <div className="relative z-10 p-8 sm:p-10">
          <DialogHeader className="space-y-4">
            {/* Pulsing alert icon */}
            <div className="flex items-center justify-center mb-2 popup-animate-stagger-1">
              <div className={cn(
                "relative rounded-full p-5",
                "bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500",
                "dark:from-amber-600 dark:via-orange-600 dark:to-amber-700",
                "shadow-lg shadow-amber-500/50",
                "popup-float"
              )}>
                <AlertCircle className="h-8 w-8 text-white" />
                <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
              </div>
            </div>

            <DialogTitle className={cn(
              "text-center text-3xl sm:text-4xl font-bold",
              "font-[var(--popup-font)]",
              "bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700",
              "dark:from-amber-400 dark:via-orange-300 dark:to-amber-400",
              "bg-clip-text text-transparent",
              "popup-animate-stagger-1"
            )}>
              {headline}
            </DialogTitle>

            <DialogDescription className={cn(
              "text-center text-base sm:text-lg",
              "text-amber-900/80 dark:text-amber-100/80",
              "font-[var(--popup-font)] font-medium",
              "leading-relaxed",
              "popup-animate-stagger-2"
            )}>
              {subheadline}
            </DialogDescription>

            {offer && (
              <div className={cn(
                "flex items-center justify-center gap-2 mt-3",
                "px-5 py-3 rounded-xl",
                "bg-gradient-to-r from-amber-100 to-orange-100",
                "dark:from-amber-900/40 dark:to-orange-900/40",
                "border-2 border-amber-300/50 dark:border-amber-700/50",
                "backdrop-blur-sm",
                "popup-animate-stagger-2"
              )}>
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className={cn(
                  "text-base font-bold",
                  "font-[var(--popup-font)]",
                  "text-amber-800 dark:text-amber-300"
                )}>
                  {offer}
                </span>
              </div>
            )}
          </DialogHeader>

          {requireEmail && (
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
                      "bg-white/80 dark:bg-black/50",
                      "backdrop-blur-sm",
                      "border-2 border-amber-300/40",
                      "focus:border-amber-500 dark:focus:border-amber-400",
                      "focus:ring-2 focus:ring-amber-500/30",
                      "transition-all duration-300",
                      "font-[var(--popup-font)]",
                      "placeholder:text-muted-foreground/60"
                    )}
                    autoFocus
                  />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500/40 pointer-events-none" />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-[var(--popup-font)] animate-in fade-in slide-in-from-top-1">
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
                    "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
                    "dark:from-amber-600 dark:via-orange-600 dark:to-amber-700",
                    "hover:from-amber-600 hover:via-orange-600 hover:to-amber-700",
                    "dark:hover:from-amber-700 dark:hover:via-orange-700 dark:hover:to-amber-800",
                    "text-white border-0",
                    "shadow-lg shadow-amber-500/40",
                    "hover:shadow-xl hover:shadow-amber-600/50",
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        {ctaText}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-background/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDecline}
                  className={cn(
                    "w-full text-sm",
                    "text-amber-700/70 dark:text-amber-300/70",
                    "hover:text-amber-900 dark:hover:text-amber-200",
                    "hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
                    "font-[var(--popup-font)]",
                    "transition-colors duration-200"
                  )}
                >
                  {declineText}
                </Button>
              </div>
            </form>
          )}

          {!requireEmail && (
            <div className="flex flex-col gap-3 mt-8 popup-animate-stagger-3">
              <Button
                onClick={() => {
                  markPopupConverted(popupId);
                  onClose();
                }}
                className={cn(
                  "w-full h-14 text-base font-semibold",
                  "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
                  "dark:from-amber-600 dark:via-orange-600 dark:to-amber-700",
                  "hover:from-amber-600 hover:via-orange-600 hover:to-amber-700",
                  "text-white border-0",
                  "shadow-lg shadow-amber-500/40",
                  "font-[var(--popup-font)]",
                  "relative overflow-hidden group"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {ctaText}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDecline}
                className={cn(
                  "w-full text-sm",
                  "text-amber-700/70 dark:text-amber-300/70",
                  "hover:text-amber-900 dark:hover:text-amber-200",
                  "font-[var(--popup-font)]"
                )}
              >
                {declineText}
              </Button>
            </div>
          )}

          <p className={cn(
            "text-xs text-center text-amber-800/60 dark:text-amber-200/60 mt-6",
            "font-[var(--popup-font)]",
            "popup-animate-stagger-3"
          )}>
            We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
