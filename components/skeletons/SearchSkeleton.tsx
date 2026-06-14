"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SearchHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-[200] border-b border-[#333333] bg-[#010010]/90 backdrop-blur-xl">
      <div className="max-w-[1563px] mx-auto border-x border-[#333333] px-4 sm:px-6 py-4 space-y-3">
        <Skeleton className="h-11 w-full rounded-none" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-none" />
          <Skeleton className="h-8 w-20 rounded-none" />
          <Skeleton className="h-8 w-16 rounded-none" />
          <Skeleton className="h-8 w-16 rounded-none" />
        </div>
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-[rgba(51,51,51,0.5)] p-4">
          <Skeleton className="h-40 w-full rounded-none mb-3" />
          <Skeleton className="h-4 w-3/4 rounded-none" />
        </div>
      ))}
    </div>
  );
}
