"use client";

import { PageShell } from "@/components/layout/page-shell-layout";

export function MarketingSkeleton() {
  return (
    <PageShell className="flex flex-col min-h-svh animate-pulse">
      <div className="h-1 bg-cg-line w-full" />
      <div className="h-10 bg-cg-ink/90 w-full" />
      <div className="h-9 bg-cg-peach/40 w-full" />
      <div className="h-16 border-b border-cg-line flex items-center px-9">
        <div className="h-8 w-32 bg-cg-bg-warm rounded-badge" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <div className="h-8 w-56 bg-cg-bg-warm rounded-badge" />
        <div className="h-14 w-full max-w-lg bg-cg-bg-warm rounded-btn" />
        <div className="h-6 w-full max-w-md bg-cg-bg-warm rounded-badge" />
        <div className="h-12 w-64 bg-cg-bg-warm rounded-btn mt-4" />
      </div>
    </PageShell>
  );
}
