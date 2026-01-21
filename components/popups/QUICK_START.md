# Popup System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Configure Your First Popup

Open `/lib/popup-config.ts` and uncomment/modify a popup:

```typescript
export const popupConfigs: PopupConfig[] = [
  newsletterPopup, // ✅ Already enabled
  // leadMagnetPopup,      // Uncomment to enable
  // exitIntentPopup,      // Uncomment to enable
];
```

### Step 2: Customize the Content

Edit the popup configuration:

```typescript
export const newsletterPopup: PopupConfig = {
  id: "newsletter-signup",
  type: "email-capture",
  trigger: { type: "time", delay: 30000 }, // 30 seconds
  enabled: true, // ✅ Make sure this is true
  emailCapture: {
    headline: "Your Custom Headline",
    subheadline: "Your custom message",
    ctaText: "Subscribe",
    onSubmit: async (email) => {
      // 🔧 Add your API call here
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    },
  },
};
```

### Step 3: Test It

1. Clear browser storage (or use incognito)
2. Visit your site
3. Wait 30 seconds (or trigger based on your config)
4. Popup should appear!

## 📋 Common Configurations

### Newsletter Signup (30 seconds)
```typescript
{
  type: "email-capture",
  trigger: { type: "time", delay: 30000 },
  frequency: { maxPerSession: 1, cooldownDays: 7 },
}
```

### Lead Magnet (50% scroll)
```typescript
{
  type: "lead-magnet",
  trigger: { type: "scroll", percentage: 50 },
  frequency: { maxPerSession: 1, cooldownDays: 30 },
}
```

### Exit Intent
```typescript
{
  type: "exit-intent",
  trigger: { type: "exit-intent" },
  frequency: { maxPerSession: 1, cooldownDays: 7 },
}
```

### First-Time Discount
```typescript
{
  type: "discount",
  trigger: { type: "time", delay: 60000 },
  targeting: { onlyNewVisitors: true },
  frequency: { maxPerSession: 1, cooldownDays: 90 },
}
```

## 🎯 Trigger Cheat Sheet

| Trigger | When to Use | Example |
|---------|-------------|---------|
| `time` | General visitors | `{ type: "time", delay: 30000 }` |
| `scroll` | Blog posts, long content | `{ type: "scroll", percentage: 50 }` |
| `exit-intent` | Last chance conversion | `{ type: "exit-intent" }` |
| `click` | Button-triggered | `{ type: "click", elementId: "btn-id" }` |
| `page-count` | Multi-page journeys | `{ type: "page-count", count: 3 }` |

## 🔧 Quick Fixes

### Popup not showing?
- ✅ Check `enabled: true`
- ✅ Verify trigger timing (wait long enough)
- ✅ Clear localStorage: `localStorage.clear()` in console
- ✅ Check targeting rules (page, user type)

### Want to test immediately?
- Change trigger to: `{ type: "time", delay: 1000 }` (1 second)
- Or use: `{ type: "manual" }` and trigger programmatically

### Disable a popup?
- Set `enabled: false` in config
- Or remove from `popupConfigs` array

## 📊 Analytics

Events are automatically tracked. To see them:
1. Open browser console
2. Look for `[Popup Analytics]` logs
3. Integrate with your analytics service (see README.md)

## 🎨 Customization

All popup components accept props for:
- Headlines and copy
- Button text
- Colors (via Tailwind classes)
- Images
- Form fields

See component files in `/components/popups/` for all options.

## 📚 Full Documentation

See `README.md` for complete documentation.
