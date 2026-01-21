"use client";

const BUFFER_SIZE = 20;
const FLUSH_MS = 4000;

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  ts?: string;
}

interface QueuedEvent extends AnalyticsEvent {
  ts: string;
}

/**
 * Client-side analytics: buffered, batched, non-blocking. Flushes to /api/analytics/track.
 * When disabled (no user), track is a no-op. Call setEnabled(true) when user is available.
 */
class AnalyticsClient {
  private buffer: QueuedEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private enabled = false;
  private flushInFlight = false;

  setEnabled(value: boolean): void {
    if (this.enabled === value) return;
    this.enabled = value;
    if (!value) {
      this.clearTimer();
      this.flush();
    }
  }

  /** Fire-and-forget. No-op when disabled. */
  track(name: string, properties?: Record<string, unknown>): void {
    if (!this.enabled || !name) return;
    const ts = new Date().toISOString();
    this.buffer.push({ name, properties: properties ?? {}, ts });
    this.schedule();
  }

  pageView(path: string, properties?: Record<string, unknown>): void {
    this.track("page_view", { path, ...properties });
  }

  feature(name: string, properties?: Record<string, unknown>): void {
    this.track("feature_use", { feature: name, ...properties });
  }

  private schedule(): void {
    if (this.buffer.length >= BUFFER_SIZE) {
      this.doFlush();
      return;
    }
    if (!this.timer) this.timer = setTimeout(() => this.doFlush(), FLUSH_MS);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Flush buffer to the API. Non-blocking; does not await. */
  flush(): void {
    this.doFlush();
  }

  private doFlush(): void {
    this.clearTimer();
    if (this.buffer.length === 0 || this.flushInFlight) return;
    const toSend = this.buffer.splice(0, BUFFER_SIZE);
    this.flushInFlight = true;
    const payload = {
      events: toSend.map(({ name, properties, ts }) => ({ name, properties, ts })),
      source: "client" as const,
    };
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .catch(() => {})
      .finally(() => {
        this.flushInFlight = false;
        if (this.buffer.length > 0) this.schedule();
      });
  }
}

export const analyticsClient = new AnalyticsClient();

/** Flush on pagehide for best-effort delivery on close/nav. */
if (typeof window !== "undefined") {
  const onUnload = () => {
    analyticsClient.flush();
  };
  window.addEventListener("pagehide", onUnload);
}
