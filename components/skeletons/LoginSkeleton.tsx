"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-5 py-16 max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-12">
          <Skeleton className="h-7 w-7 rounded-[13px]" />
          <Skeleton className="h-5 w-24 rounded-[13px]" />
        </div>
        <div className="space-y-3 mb-8">
          <Skeleton className="h-12 w-48 rounded-[18px]" />
          <Skeleton className="h-12 w-40 rounded-[18px]" />
          <Skeleton className="h-12 w-52 rounded-[18px]" />
          <Skeleton className="h-12 w-44 rounded-[18px]" />
        </div>
        <Skeleton className="h-4 w-full max-w-xs mb-8 rounded-[13px]" />
        <div className="border border-border rounded-[30px] p-6 space-y-4 bg-secondary">
          <Skeleton className="h-12 w-full rounded-[18px]" />
          <Skeleton className="h-3 w-48 mx-auto rounded-[13px]" />
        </div>
      </div>
    </div>
  );
}
