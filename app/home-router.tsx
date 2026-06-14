"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HomeClient from "./home-client";
import { MarketingHome } from "@/components/marketing/marketing-home";
import { MarketingSkeleton } from "@/components/marketing/marketing-skeleton";
import { AppShellSkeleton } from "@/components/skeletons";
import { AuthCallbackHandler } from "@/components/auth/auth-callback-handler";
import { isAppViewParam } from "@/lib/auth/constants";

function HomeRouterContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const hasOAuthCode = searchParams.has("code");
  const view = searchParams.get("view");
  const isAppDeepLink = isAppViewParam(view);

  if (hasOAuthCode && !user) {
    return <AuthCallbackHandler />;
  }

  if (loading) {
    return isAppDeepLink ? <AppShellSkeleton /> : <MarketingSkeleton />;
  }

  if (user) {
    return (
      <Suspense fallback={<AppShellSkeleton />}>
        <HomeClient />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<MarketingSkeleton />}>
      <MarketingHome />
    </Suspense>
  );
}

export default function HomeRouter() {
  return (
    <Suspense fallback={<MarketingSkeleton />}>
      <HomeRouterContent />
    </Suspense>
  );
}
