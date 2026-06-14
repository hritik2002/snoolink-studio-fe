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
import { Percent, Sparkles, Copy, Check, Gift, ArrowRight, X } from "lucide-react";
import { usePopupAnalytics } from "@/lib/hooks/use-popup-analytics";
import { markPopupConverted } from "@/lib/hooks/use-popup-storage";
import { cn } from "@/lib/utils";

export interface DiscountPopupProps {
  open: boolean;
  onClose: () => void;
  popupId: string;
  discount: string; // e.g., "10%", "$20", "Free shipping"
  headline?: string;
  subheadline?: string;
  code?: string; // Discount code to display
  deadline?: string; // e.g., "Expires in 24 hours"
  ctaText?: string;
  declineText?: string;
  placeholder?: string;
  onSubmit?: (email: string) => Promise<void> | void;
  requireEmail?: boolean;
}

export function DiscountPopup({
  open,
  onClose,
  popupId,
  discount,
  headline,
  subheadline,
  code,
  deadline,
  ctaText = "Claim My Discount",
  declineText = "No thanks",
  placeholder = "Enter your email",
  onSubmit,
  requireEmail = false,
}: DiscountPopupProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const analytics = usePopupAnalytics(popupId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!requireEmail) {
      // If email not required, just mark as converted
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
        console.log("Discount claimed:", { email, code });
      }

      analytics.trackSubmitSuccess({ email, code, discount });
      markPopupConverted(popupId);
      setEmail("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
          "dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40",
          "popup-animate-enter"
        )}
        onEscapeKeyDown={() => handleClose("escape")}
        onPointerDownOutside={() => handleClose("outside")}
      >
        {/* Celebration background */}
        <div className="absolute inset-0 opacity-30 dark:opacity-15 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, oklch(0.70 0.18 180) 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, oklch(0.75 0.20 200) 0%, transparent 50%),
                                radial-gradient(circle at 50% 50%, oklch(0.80 0.15 190) 0%, transparent 60%)`,
            }}
          />
          {/* Geometric pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, oklch(0.70 0.10 190 / 0.1) 20px, oklch(0.70 0.10 190 / 0.1) 22px),
                                repeating-linear-gradient(90deg, transparent, transparent 20px, oklch(0.70 0.10 190 / 0.1) 20px, oklch(0.70 0.10 190 / 0.1) 22px)`,
            }}
          />
        </div>

        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "popup-gradient-shift 6s ease infinite",
          }}
        />

        <button
          onClick={() => handleClose("button")}
          className={cn(
            "absolute right-4 top-4 z-50 rounded-full p-2",
            "bg-white/90 dark:bg-black/50 backdrop-blur-sm",
            "border border-emerald-200/50 dark:border-emerald-800/30",
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
            {/* Gift icon with sparkle */}
            <div className="flex items-center justify-center mb-2 popup-animate-stagger-1">
              <div className={cn(
                "relative rounded-2xl p-5",
                "bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400",
                "dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600",
                "shadow-xl shadow-emerald-500/40",
                "popup-float"
              )}>
                <Gift className="h-8 w-8 text-white" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
              </div>
            </div>

            {/* Discount badge */}
            <div className="flex items-center justify-center popup-animate-stagger-1">
              <div className={cn(
                "relative px-6 py-3 rounded-2xl",
                "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
                "dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600",
                "shadow-lg shadow-emerald-500/30",
                "border-2 border-white/20"
              )}>
                <div className="flex items-center gap-2">
                  <Percent className="h-6 w-6 text-white" />
                  <span className={cn(
                    "text-3xl font-bold text-white",
                    "font-[var(--popup-font)]"
                  )}>
                    {discount}
                  </span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-pulse" />
              </div>
            </div>

            <DialogTitle className={cn(
              "text-center text-3xl sm:text-4xl font-bold",
              "font-[var(--popup-font)]",
              "bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700",
              "dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300",
              "bg-clip-text text-transparent",
              "popup-animate-stagger-1"
            )}>
              {headline || `Get ${discount} Off!`}
            </DialogTitle>

            <DialogDescription className={cn(
              "text-center text-base sm:text-lg",
              "text-emerald-900/80 dark:text-emerald-100/80",
              "font-[var(--popup-font)] font-medium",
              "leading-relaxed",
              "popup-animate-stagger-2"
            )}>
              {subheadline || "Special offer just for you"}
            </DialogDescription>

            {deadline && (
              <div className={cn(
                "flex items-center justify-center gap-2 mt-2",
                "px-4 py-2 rounded-full",
                "bg-emerald-100/60 dark:bg-emerald-900/30",
                "border border-emerald-300/50 dark:border-emerald-700/50",
                "backdrop-blur-sm",
                "popup-animate-stagger-2"
              )}>
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className={cn(
                  "text-sm font-semibold",
                  "font-[var(--popup-font)]",
                  "text-emerald-700 dark:text-emerald-300"
                )}>
                  {deadline}
                </span>
              </div>
            )}
          </DialogHeader>

          {code && (
            <div className="space-y-3 mt-6 popup-animate-stagger-2">
              <p className={cn(
                "text-sm text-center text-emerald-800/70 dark:text-emerald-200/70",
                "font-[var(--popup-font)] font-medium"
              )}>
                Use code at checkout:
              </p>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex-1 relative rounded-xl px-5 py-4",
                  "bg-white/80 dark:bg-black/50",
                  "backdrop-blur-sm",
                  "border-2 border-dashed border-emerald-400/50 dark:border-emerald-600/50",
                  "hover:border-emerald-500 dark:hover:border-emerald-500",
                  "transition-all duration-300",
                  "group"
                )}>
                  <code className={cn(
                    "text-2xl font-mono font-bold",
                    "font-[var(--popup-font)]",
                    "text-emerald-700 dark:text-emerald-300",
                    "block text-center"
                  )}>
                    {code}
                  </code>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className={cn(
                    "h-14 w-14 rounded-xl",
                    "bg-emerald-500 hover:bg-emerald-600",
                    "dark:bg-emerald-600 dark:hover:bg-emerald-700",
                    "border-emerald-600 dark:border-emerald-700",
                    "text-white",
                    "shadow-lg shadow-emerald-500/30",
                    "transition-all duration-300",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  {copied ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {requireEmail && (
            <form onSubmit={handleSubmit} className="space-y-5 mt-6 popup-animate-stagger-3">
              <div className="space-y-2">
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
                    "border-2 border-emerald-300/40",
                    "focus:border-emerald-500 dark:focus:border-emerald-400",
                    "focus:ring-2 focus:ring-emerald-500/30",
                    "transition-all duration-300",
                    "font-[var(--popup-font)]",
                    "placeholder:text-muted-foreground/60"
                  )}
                  autoFocus
                />
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
                    "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
                    "dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600",
                    "hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600",
                    "dark:hover:from-emerald-700 dark:hover:via-teal-700 dark:hover:to-cyan-700",
                    "text-white border-0",
                    "shadow-lg shadow-emerald-500/40",
                    "hover:shadow-xl hover:shadow-emerald-600/50",
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
                        Claiming...
                      </>
                    ) : (
                      <>
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
                    "text-emerald-700/70 dark:text-emerald-300/70",
                    "hover:text-emerald-900 dark:hover:text-emerald-200",
                    "hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20",
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
            <div className="flex flex-col gap-3 mt-6 popup-animate-stagger-3">
              <Button
                onClick={() => {
                  markPopupConverted(popupId);
                  onClose();
                }}
                className={cn(
                  "w-full h-14 text-base font-semibold",
                  "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500",
                  "dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600",
                  "hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600",
                  "text-white border-0",
                  "shadow-lg shadow-emerald-500/40",
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
                  "text-emerald-700/70 dark:text-emerald-300/70",
                  "hover:text-emerald-900 dark:hover:text-emerald-200",
                  "font-[var(--popup-font)]"
                )}
              >
                {declineText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
