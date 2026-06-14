"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CollectionsPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <div className="border-b border-[#333333] bg-[#010010]/90 px-4 sm:px-6 py-4">
        <div className="flex justify-between mb-3">
          <Skeleton className="h-5 w-28 rounded-none" />
          <Skeleton className="h-9 w-24 rounded-[6px]" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-none" />
          ))}
        </div>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

export function CollectionsItemsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 sm:p-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="aspect-video w-full rounded-none" />
      ))}
    </div>
  );
}
