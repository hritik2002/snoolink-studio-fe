"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Full-page skeleton when collections list is loading (initial fetch). */
export function CollectionsPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header with gradient */}
      <div className="sticky top-0 z-20 pt-4 sm:pt-6 pb-4 px-4 sm:px-6 flex-shrink-0 overflow-hidden">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.25) 0%, rgba(196, 181, 253, 0.15) 30%, rgba(233, 213, 255, 0.08) 60%, rgba(255, 255, 255, 1) 100%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div className="space-y-2">
              <Skeleton className="h-8 sm:h-9 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Chips bar */}
      <div className="border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex gap-2 flex-1 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <Skeleton className="h-8 w-28 rounded-md flex-shrink-0" />
        <Skeleton className="h-8 w-24 rounded-md flex-shrink-0" />
        <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
        <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-200">
              <Skeleton className="aspect-video min-h-[160px] sm:min-h-[180px] w-full rounded-lg mb-3" />
              <Skeleton className="h-4 w-3/4 mb-1 sm:mb-2" />
              <Skeleton className="h-3 w-1/2 mb-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** In-content skeleton when collection items are loading (has collection, fetching items). */
export function CollectionsItemsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <div key={i} className="rounded-lg sm:rounded-xl p-2 sm:p-3 border border-gray-200">
          <Skeleton className="aspect-video min-h-[160px] sm:min-h-[180px] w-full rounded-lg mb-3" />
          <Skeleton className="h-4 w-3/4 mb-1 sm:mb-2" />
          <Skeleton className="h-3 w-1/2 mb-2" />
        </div>
      ))}
    </div>
  );
}
