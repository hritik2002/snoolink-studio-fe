"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { MarketingSkeleton } from "@/components/marketing/marketing-skeleton";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";

function HomeRouterContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const hasOAuthCode = searchParams.has("code");

  if (hasOAuthCode && !user) {
    return <AuthCallbackHandler />;
  }

  if (loading) {
    return <MarketingSkeleton />;
  }

  // Authenticated users are redirected to /app/search by middleware
  if (user) {
    return <MarketingSkeleton />;
  }

  return <MarketingHome />;
}

export default function HomeRouter() {
  return (
    <Suspense fallback={<MarketingSkeleton />}>
      <HomeRouterContent />
    </Suspense>
  );
}
