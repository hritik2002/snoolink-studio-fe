"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsClient } from "@/lib/analytics";

/**
 * Enables analytics when user is logged in, sends page_view on route change, flushes on logout.
 * Place inside AuthProvider.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    analyticsClient.setEnabled(!!user);
    if (!user) analyticsClient.flush();
  }, [user]);

  useEffect(() => {
    if (pathname && user) {
      // Avoid duplicate for same path (e.g. hash change)
      if (prevPath.current !== pathname) {
        prevPath.current = pathname;
        analyticsClient.pageView(pathname);
      }
    } else {
      prevPath.current = null;
    }
  }, [pathname, user]);

  return <>{children}</>;
}
