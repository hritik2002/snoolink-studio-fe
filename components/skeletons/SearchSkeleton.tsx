"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the Search results area when isSearching.
 * Renders in place of the results list; header and search bar stay visible.
 */
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-5">
              <Skeleton className="w-full h-48 sm:h-40 rounded-lg sm:rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
