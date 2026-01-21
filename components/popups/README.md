# Popup System Documentation

A comprehensive, conversion-optimized popup system for Snoolink Studio with multiple popup types, smart triggers, frequency capping, and analytics tracking.

## Features

✅ **Multiple Popup Types**
- Email capture
- Lead magnet delivery
- Discount/promotion
- Exit intent
- Announcement banners

✅ **Smart Triggers**
- Time-based (after X seconds)
- Scroll-based (at X% scroll depth)
- Exit intent detection
- Click-triggered (for specific buttons)
- Page count (after X page views)
- Manual (programmatic)

✅ **Frequency Capping**
- Per-session limits
- Cooldown periods
- Total show limits
- Respects user dismissals

✅ **Targeting Rules**
- Page inclusion/exclusion
- Authenticated vs. anonymous users
- New vs. returning visitors
- Custom targeting logic

✅ **Analytics Tracking**
- View tracking
- Form interactions
- Conversion tracking
- Dismissal tracking

✅ **Accessibility**
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader compatible
- Focus management
- ARIA labels

## Quick Start

### 1. Configure Popups

Edit `/lib/popup-config.ts` to configure your popups:

```typescript
export const newsletterPopup: PopupConfig = {
  id: "newsletter-signup",
  type: "email-capture",
  trigger: { type: "time", delay: 30000 }, // 30 seconds
  enabled: true,
  frequency: {
    maxPerSession: 1,
    cooldownDays: 7,
    excludeConverted: true,
  },
  emailCapture: {
    headline: "Get Weekly AI Search Tips",
    subheadline: "Join thousands of creators...",
    ctaText: "Subscribe Now",
    onSubmit: async (email) => {
      // Your API call here
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
  },
};
```

### 2. Enable Popups

Add popups to the `popupConfigs` array in `/lib/popup-config.ts`:

```typescript
export const popupConfigs: PopupConfig[] = [
  newsletterPopup,
  leadMagnetPopup, // Uncomment to enable
  // exitIntentPopup,
];
```

### 3. Customize Content

Each popup type has customizable props. See the examples in `/lib/popup-config.ts` for all options.

## Popup Types

### Email Capture Popup

Best for: Newsletter subscriptions, general list building

```typescript
{
  type: "email-capture",
  emailCapture: {
    headline: "Get Weekly Tips",
    subheadline: "Join our newsletter",
    ctaText: "Subscribe",
    incentive: "10% off your first purchase",
    onSubmit: async (email) => { /* ... */ },
  },
}
```

### Lead Magnet Popup

Best for: Content downloads, gated resources

```typescript
{
  type: "lead-magnet",
  leadMagnet: {
    title: "Ultimate Guide",
    description: "20+ pages of tips",
    previewImage: "/images/guide.jpg",
    fileName: "guide.pdf",
    requireName: false,
    onSubmit: async (email, name) => { /* ... */ },
  },
}
```

### Discount Popup

Best for: Promotions, first-time offers

```typescript
{
  type: "discount",
  discount: {
    discount: "20%",
    code: "WELCOME20",
    deadline: "Expires in 24 hours",
    requireEmail: true,
    onSubmit: async (email) => { /* ... */ },
  },
}
```

### Exit Intent Popup

Best for: Last-chance conversion

```typescript
{
  type: "exit-intent",
  trigger: { type: "exit-intent" },
  exitIntent: {
    headline: "Wait! Before you go...",
    offer: "Get 10% off",
    requireEmail: true,
    onSubmit: async (email) => { /* ... */ },
  },
}
```

## Trigger Strategies

### Time-Based

```typescript
trigger: { type: "time", delay: 30000 } // 30 seconds
```

**Best for:** General visitors, homepage
**Recommended:** 30-60 seconds (proven engagement)

### Scroll-Based

```typescript
trigger: { type: "scroll", percentage: 50 } // 50% scroll
```

**Best for:** Blog posts, long-form content
**Recommended:** 25-50% scroll depth

### Exit Intent

```typescript
trigger: { type: "exit-intent" }
```

**Best for:** E-commerce, lead gen
**Note:** Only works on desktop (mouse movement)

### Click-Triggered

```typescript
trigger: { type: "click", elementId: "download-btn" }
```

**Best for:** Lead magnets, demos, gated content
**Zero annoyance factor**

### Page Count

```typescript
trigger: { type: "page-count", count: 3 }
```

**Best for:** Multi-page journeys, comparison shoppers

## Frequency Capping

Control how often popups appear:

```typescript
frequency: {
  maxPerSession: 1,        // Max times per session
  cooldownDays: 7,         // Days before showing again
  excludeConverted: true,  // Don't show if user converted
  maxTotalShows: 5,        // Total lifetime shows
}
```

## Targeting Rules

Show popups to specific audiences:

```typescript
targeting: {
  excludePages: ["/checkout", "/billing"],  // Don't show on these pages
  includePages: ["/"],                      // Only show on these (if specified)
  excludeAuthenticated: false,               // Hide from logged-in users
  onlyNewVisitors: true,                     // First-time visitors only
}
```

## Analytics

The system automatically tracks:

- `popup_view` - Popup displayed
- `popup_form_focus` - User focused on form
- `popup_submit_attempt` - Form submission started
- `popup_submit_success` - Successful submission
- `popup_close_click` - Close button clicked
- `popup_outside_click` - Clicked outside popup
- `popup_escape_key` - Pressed Escape key
- `popup_decline_click` - Declined offer

### Integrate with Analytics

Edit `/lib/hooks/use-popup-analytics.ts` to send events to your analytics service:

```typescript
// Google Analytics example
if (typeof window !== "undefined" && (window as any).gtag) {
  (window as any).gtag("event", eventType, {
    popup_id: popupId,
    ...metadata,
  });
}

// Backend API example
fetch("/api/analytics/popup", {
  method: "POST",
  body: JSON.stringify(event),
});
```

## Best Practices

### 1. Timing
- ✅ Show after 30-60 seconds (not immediately)
- ✅ Use scroll triggers for content pages
- ✅ Use exit intent as last resort

### 2. Value Proposition
- ✅ Clear, specific benefit
- ✅ Relevant to page context
- ✅ Worth the interruption

### 3. Design
- ✅ Easy to dismiss (visible X button)
- ✅ Mobile-friendly (full-width bottom or center)
- ✅ Don't cover entire screen
- ✅ Clear visual hierarchy

### 4. Frequency
- ✅ Maximum once per session
- ✅ 7-30 day cooldown after dismissal
- ✅ Respect user choice (remember dismissals)

### 5. Compliance
- ✅ Link to privacy policy
- ✅ Clear consent language
- ✅ Honor unsubscribe requests
- ✅ GDPR compliant

## Mobile Considerations

- Exit intent doesn't work on mobile (use alternatives)
- Full-screen overlays feel aggressive
- Bottom slide-ups work well
- Larger touch targets
- Easy dismiss gestures

## Testing

### Clear Storage for Testing

```typescript
import { clearAllPopupStorage } from "@/lib/hooks/use-popup-storage";

// In browser console or component
clearAllPopupStorage();
```

### Manual Trigger

```typescript
// In your component
const handleShowPopup = () => {
  // Trigger popup programmatically
  // (You'll need to expose this from PopupManager)
};
```

## Common Use Cases

### E-commerce
1. Entry/scroll: First-purchase discount
2. Exit intent: Bigger discount or reminder
3. Cart abandonment: Complete your order

### B2B SaaS
1. Click-triggered: Demo request, lead magnets
2. Scroll: Newsletter/blog subscription
3. Exit intent: Trial reminder

### Content/Media
1. Scroll-based: Newsletter after engagement
2. Page count: Subscribe after multiple visits
3. Exit intent: Don't miss future content

## Troubleshooting

### Popup not showing?
1. Check `enabled: true` in config
2. Verify targeting rules (page, user type)
3. Check frequency capping (cooldown, session limit)
4. Clear localStorage: `clearAllPopupStorage()`

### Analytics not tracking?
1. Check browser console for errors
2. Verify analytics service integration
3. Check network tab for API calls

### Mobile issues?
1. Test on actual device (not just responsive mode)
2. Check touch targets (min 44x44px)
3. Verify exit intent alternatives

## Examples

See `/lib/popup-config.ts` for complete examples of:
- Newsletter signup
- Lead magnet download
- First-time discount
- Exit intent capture
- Click-triggered demo request

## Support

For questions or issues, check:
- Component source: `/components/popups/`
- Hooks: `/lib/hooks/use-popup-*.ts`
- Configuration: `/lib/popup-config.ts`
