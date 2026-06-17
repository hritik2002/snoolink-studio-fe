"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SearchHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-[200] border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-[60px] py-4 space-y-3">
        <Skeleton className="h-11 w-full rounded-btn" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-badge" />
          <Skeleton className="h-8 w-20 rounded-badge" />
          <Skeleton className="h-8 w-16 rounded-badge" />
          <Skeleton className="h-8 w-16 rounded-badge" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="py-4 space-y-4">
      <div className="pb-4 border-b border-app-border-light space-y-2">
        <Skeleton className="h-4 w-32 rounded-app-sm" />
        <Skeleton className="h-3.5 w-48 rounded-app-sm" />
      </div>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-card border border-app-border bg-white p-4 sm:p-5 space-y-5"
        >
          <div className="flex flex-col lg:flex-row gap-5">
            <Skeleton className="w-full lg:w-[min(420px,42%)] aspect-video rounded-app-md shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3 rounded-app-sm" />
                <Skeleton className="h-3.5 w-1/3 rounded-app-sm" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-pill" />
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-app-md" />
                <Skeleton className="h-14 w-full rounded-app-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
