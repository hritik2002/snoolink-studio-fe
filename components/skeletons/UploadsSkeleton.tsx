"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function UploadsSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <div className="border-b border-[#333333] bg-[#010010]/90 px-4 sm:px-6 py-4">
        <Skeleton className="h-5 w-20 rounded-none" />
      </div>
      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-[1563px] mx-auto w-full border-x border-[#333333]">
        <Skeleton className="h-32 w-full rounded-none border border-dashed border-[rgba(51,51,51,0.5)]" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-none" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

export function UploadsListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-none" />
      ))}
    </div>
  );
}
