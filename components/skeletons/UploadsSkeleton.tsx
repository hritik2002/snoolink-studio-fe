"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function UploadsSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full py-3 sm:py-4 md:py-6 lg:py-8 bg-background px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Skeleton className="h-8 sm:h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* Upload zone placeholder */}
      <div className="mb-4 sm:mb-6">
        <div className="p-4 sm:p-6 md:p-8 border-2 border-dashed border-border rounded-none bg-muted/30/50">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-10 w-28 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-12 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-md ml-auto" />
      </div>

      {/* File cards */}
      <UploadsListSkeleton />
    </div>
  );
}

/** Just the file list grid skeleton; use when header/upload zone are already rendered. */
export function UploadsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 border-2 border-border rounded-xl sm:rounded-2xl">
          <Skeleton className="h-6 w-6 sm:h-7 sm:w-7 rounded-full flex-shrink-0" />
          <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-48 hidden sm:block" />
          </div>
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
