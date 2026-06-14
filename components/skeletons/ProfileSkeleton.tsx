"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="border-b border-[#333333] px-4 sm:px-6 py-4">
        <Skeleton className="h-5 w-20 rounded-none" />
      </div>
      <div className="px-4 sm:px-6 py-6 max-w-lg">
        <div className="border border-[rgba(51,51,51,0.5)] p-6 space-y-4">
          <Skeleton className="h-4 w-32 rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-11 w-full rounded-none" />
          <Skeleton className="h-12 w-full rounded-[6px]" />
        </div>
      </div>
    </div>
  );
}
