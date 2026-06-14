"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function UploadsSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <div className="border-b border-border bg-background/90 px-4 sm:px-6 py-4">
        <Skeleton className="h-5 w-20 rounded-[18px]" />
      </div>
      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1563px] mx-auto w-full border-x border-border">
        <Skeleton className="h-32 w-full rounded-[18px] border border-dashed border-border" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-[18px]" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}

export function UploadsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-[18px]" />
      ))}
    </div>
  );
}
