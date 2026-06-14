"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background dot-grid relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-6">
        <div className="flex flex-col items-center mb-6">
          <Skeleton className="h-20 w-20 rounded-full mb-4" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-5 w-72 max-w-full mb-8" />
        <div className="flex justify-center gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
        <Skeleton className="w-full max-w-sm h-px mb-8" />
        <div className="w-full bg-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-6 w-24 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
      <div className="absolute bottom-6">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
