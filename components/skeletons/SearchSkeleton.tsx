"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SearchHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-[200] border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="max-w-[1228px] mx-auto px-4 sm:px-6 lg:px-[60px] py-4 space-y-3">
        <Skeleton className="h-11 w-full rounded-[18px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-[13px]" />
          <Skeleton className="h-8 w-20 rounded-[13px]" />
          <Skeleton className="h-8 w-16 rounded-[13px]" />
          <Skeleton className="h-8 w-16 rounded-[13px]" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border p-4">
          <Skeleton className="h-40 w-full rounded-[18px] mb-3" />
          <Skeleton className="h-4 w-3/4 rounded-[18px]" />
        </div>
      ))}
    </div>
  );
}
