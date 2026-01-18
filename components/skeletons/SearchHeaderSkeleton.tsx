"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the Search page header - shown when page first loads
 * (not used when just searching, since the real header stays visible)
 */
export function SearchHeaderSkeleton() {
  return (
    <div className="sticky top-0 left-0 right-0 z-[200] pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6 flex-shrink-0 overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.25) 0%, rgba(196, 181, 253, 0.15) 30%, rgba(233, 213, 255, 0.08) 60%, rgba(255, 255, 255, 1) 100%)',
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <Skeleton className="h-12 sm:h-14 w-full rounded-xl sm:rounded-2xl mb-4 sm:mb-5" />
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
          <Skeleton className="w-px h-8 hidden sm:block" />
          <div className="flex gap-2 flex-1">
            <Skeleton className="h-8 w-8 rounded-full" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
          <Skeleton className="h-4 w-12" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-32 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
