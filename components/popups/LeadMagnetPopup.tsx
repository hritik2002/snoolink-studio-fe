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
import { Download, FileText, Sparkles, X } from "lucide-react";
import { usePopupAnalytics } from "@/lib/hooks/use-popup-analytics";
import { markPopupConverted } from "@/lib/hooks/use-popup-storage";

export interface LeadMagnetPopupProps {
  open: boolean;
  onClose: () => void;
  popupId: string;
  title: string;
  description: string;
  previewImage?: string; // URL to preview image
  fileName?: string; // e.g., "Ultimate-Guide.pdf"
  headline?: string;
  ctaText?: string;
  declineText?: string;
  placeholder?: string;
  onSubmit?: (email: string, name?: string) => Promise<void> | void;
  requireName?: boolean;
}

export function LeadMagnetPopup({
  open,
  onClose,
  popupId,
  title,
  description,
  previewImage,
  fileName,
  headline,
  ctaText = "Get My Free Guide",
  declineText = "Maybe later",
  placeholder = "Enter your email",
  onSubmit,
  requireName = false,
}: LeadMagnetPopupProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const analytics = usePopupAnalytics(popupId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (requireName && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    analytics.trackSubmitAttempt();

    try {
      if (onSubmit) {
        await onSubmit(email, requireName ? name : undefined);
      } else {
        // Default: just log (you can replace with API call)
        console.log("Lead magnet submitted:", { email, name });
      }

      analytics.trackSubmitSuccess({ email, name, fileName });
      markPopupConverted(popupId);
      setEmail("");
      setName("");
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
        className="sm:max-w-lg"
        onEscapeKeyDown={() => handleClose("escape")}
        onPointerDownOutside={() => handleClose("outside")}
      >
        <DialogHeader>
          {previewImage && (
            <div className="mb-4 -mx-6 -mt-6">
              <img
                src={previewImage}
                alt={title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {headline || `Get Your Free ${title}`}
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {description}
          </DialogDescription>
          {fileName && (
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <Download className="h-4 w-4" />
              <span>Instant download</span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {requireName && (
            <div>
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                disabled={isSubmitting}
                className="h-11"
              />
            </div>
          )}
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
              className="h-11"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !email.trim() || (requireName && !name.trim())}
              className="w-full h-11"
            >
              {isSubmitting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {ctaText}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleDecline}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              {declineText}
            </Button>
          </div>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </DialogContent>
    </Dialog>
  );
}
