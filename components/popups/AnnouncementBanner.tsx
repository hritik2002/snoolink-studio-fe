"use client"

import { useState } from "react";
import { X, AlertCircle, Info, Sparkles, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnnouncementBannerProps {
  id: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
  variant?: "default" | "info" | "warning" | "success";
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AnnouncementBanner({
  id,
  message,
  linkText,
  linkUrl,
  variant = "default",
  dismissible = true,
  onDismiss,
  className,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    // Store dismissal in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(`banner_dismissed_${id}`, "true");
    }
  };

  // Check if already dismissed
  if (typeof window !== "undefined") {
    const wasDismissed = localStorage.getItem(`banner_dismissed_${id}`);
    if (wasDismissed === "true" && dismissed) {
      return null;
    }
  }

  if (dismissed) return null;

  const variantConfig = {
    default: {
      bg: "announcement-bar",
      text: "text-white",
      icon: Sparkles,
      iconBg: "bg-primary/20",
      link: "text-white/90 hover:text-white underline-offset-4",
      border: "border-b border-white/10",
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600",
      text: "text-white",
      icon: Info,
      iconBg: "bg-white/20",
      link: "text-white/90 hover:text-white underline-offset-4",
      border: "border-b border-white/20",
    },
    warning: {
      bg: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
      text: "text-white",
      icon: AlertCircle,
      iconBg: "bg-white/20",
      link: "text-white/90 hover:text-white underline-offset-4",
      border: "border-b border-white/20",
    },
    success: {
      bg: "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600",
      text: "text-white",
      icon: CheckCircle2,
      iconBg: "bg-white/20",
      link: "text-white/90 hover:text-white underline-offset-4",
      border: "border-b border-white/20",
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        config.bg,
        config.text,
        config.border,
        "px-4 py-3 sm:px-6 sm:py-4",
        "flex items-center justify-between gap-4",
        "popup-animate-enter",
        className
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`,
          }}
        />
      </div>

      {/* Shimmer effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "gradient-shift 3s ease infinite",
        }}
      />

      <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        {/* Icon with pulse */}
        <div className={cn(
          "flex-shrink-0 rounded-lg p-2",
          config.iconBg,
          "backdrop-blur-sm",
          "popup-float"
        )}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>

        {/* Message */}
        <p className={cn(
          "text-sm sm:text-base font-medium flex-1",
          "font-[var(--popup-font)]",
          "leading-relaxed"
        )}>
          {message}
        </p>

        {/* Link */}
        {linkText && linkUrl && (
          <a
            href={linkUrl}
            className={cn(
              "text-sm sm:text-base font-semibold",
              "flex-shrink-0",
              "underline hover:no-underline",
              "transition-all duration-200",
              "font-[var(--popup-font)]",
              config.link
            )}
          >
            {linkText} →
          </a>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0",
            "rounded-full",
            "bg-white/10 hover:bg-white/20",
            "text-white",
            "backdrop-blur-sm",
            "transition-all duration-200",
            "hover:scale-110 active:scale-95",
            "relative z-10"
          )}
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Dismiss</span>
        </Button>
      )}
    </div>
  );
}
