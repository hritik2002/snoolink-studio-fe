/**
 * Popup Configuration
 * 
 * Configure your popups here. Each popup can have different triggers,
 * targeting rules, and frequency capping.
 * 
 * Example configurations for different use cases:
 */

import { PopupConfig } from "@/components/popups";

// Example: Newsletter signup after 30 seconds
export const newsletterPopup: PopupConfig = {
  id: "newsletter-signup",
  type: "email-capture",
  trigger: { type: "time", delay: 30000 }, // 30 seconds
  enabled: false, // Disabled - enable when ready to launch
  frequency: {
    maxPerSession: 1,
    cooldownDays: 7,
    excludeConverted: true,
  },
  emailCapture: {
    headline: "Get Weekly AI Search Tips",
    subheadline:
      "Join thousands of creators getting the latest semantic search insights and product updates.",
    ctaText: "Subscribe Now",
    declineText: "No thanks",
    incentive: "Free weekly newsletter",
    onSubmit: async (email) => {
      // TODO: Replace with your API call
      console.log("Subscribing email:", email);
      // Example:
      // await fetch("/api/newsletter/subscribe", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });
    },
  },
  targeting: {
    excludePages: ["/checkout", "/billing", "/settings"],
    excludeAuthenticated: false, // Show to logged-in users too
  },
};

// Example: Lead magnet after 50% scroll
export const leadMagnetPopup: PopupConfig = {
  id: "guide-download",
  type: "lead-magnet",
  trigger: { type: "scroll", percentage: 50 },
  enabled: false, // Disabled by default - enable when ready
  frequency: {
    maxPerSession: 1,
    cooldownDays: 30,
    excludeConverted: true,
  },
  leadMagnet: {
    title: "Ultimate Guide to Semantic Search",
    description:
      "Learn how to find exactly what you're looking for using AI-powered semantic search. 20+ pages of tips and strategies.",
    previewImage: "/images/guide-preview.jpg", // Add your preview image
    fileName: "semantic-search-guide.pdf",
    headline: "Get Your Free Guide",
    ctaText: "Download Free Guide",
    declineText: "Maybe later",
    requireName: false,
    onSubmit: async (email, name) => {
      // TODO: Replace with your API call
      console.log("Lead magnet download:", { email, name });
      // Example:
      // await fetch("/api/lead-magnet/download", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, name, guide: "semantic-search" }),
      // });
    },
  },
  targeting: {
    includePages: ["/"], // Only show on homepage
    excludeAuthenticated: false,
  },
};

// Example: First-time visitor discount
export const firstTimeDiscountPopup: PopupConfig = {
  id: "first-time-discount",
  type: "discount",
  trigger: { type: "time", delay: 60000 }, // 60 seconds
  enabled: false, // Disabled by default
  frequency: {
    maxPerSession: 1,
    cooldownDays: 90, // Don't show again for 90 days
    excludeConverted: true,
  },
  discount: {
    discount: "20%",
    headline: "Welcome! Get 20% Off Your First Month",
    subheadline: "Start your premium subscription today",
    code: "WELCOME20",
    deadline: "Limited time offer",
    ctaText: "Claim My Discount",
    declineText: "No thanks",
    requireEmail: true,
    onSubmit: async (email) => {
      // TODO: Replace with your API call
      console.log("Discount claimed:", email);
    },
  },
  targeting: {
    onlyNewVisitors: true,
    excludePages: ["/checkout", "/billing"],
  },
};

// Example: Exit intent popup
export const exitIntentPopup: PopupConfig = {
  id: "exit-intent-capture",
  type: "exit-intent",
  trigger: { type: "exit-intent" },
  enabled: false, // Disabled by default
  frequency: {
    maxPerSession: 1,
    cooldownDays: 7,
    excludeConverted: true,
  },
  exitIntent: {
    headline: "Wait! Before you go...",
    subheadline:
      "Get weekly tips on AI-powered search and never miss an update.",
    offer: "Free weekly newsletter",
    ctaText: "Stay Connected",
    declineText: "No thanks, I'll pass",
    requireEmail: true,
    onSubmit: async (email) => {
      // TODO: Replace with your API call
      console.log("Exit intent captured:", email);
    },
  },
  targeting: {
    excludePages: ["/checkout", "/billing"],
    excludeAuthenticated: false,
  },
};

// Example: Click-triggered popup (for specific buttons)
export const clickTriggeredPopup: PopupConfig = {
  id: "demo-request",
  type: "email-capture",
  trigger: { type: "click", elementId: "request-demo-btn" },
  enabled: false,
  frequency: {
    maxPerSession: 3, // Allow multiple clicks
    cooldownDays: 0,
    excludeConverted: false,
  },
  emailCapture: {
    headline: "Request a Demo",
    subheadline: "See how Snoolink can transform your workflow",
    ctaText: "Schedule Demo",
    declineText: "Cancel",
    onSubmit: async (email) => {
      // TODO: Replace with your API call
      console.log("Demo requested:", email);
    },
  },
};

/**
 * Export all popup configurations
 * Add/remove popups from this array to control which ones are active
 * 
 * NOTE: All popups are currently disabled. Set enabled: true on individual popups
 * and add them to this array when ready to launch.
 */
export const popupConfigs: PopupConfig[] = [
  // newsletterPopup,      // Disabled - set enabled: true to enable
  // leadMagnetPopup,      // Disabled - set enabled: true to enable
  // firstTimeDiscountPopup, // Disabled - set enabled: true to enable
  // exitIntentPopup,      // Disabled - set enabled: true to enable
  // clickTriggeredPopup,  // Disabled - set enabled: true to enable
];
