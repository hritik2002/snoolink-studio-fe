"use client";

import { Suspense, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";
import { TopBar } from "@/components/app/TopBar";
import ImageSearch from "@/components/imageSearch";
import ImageCollections from "@/components/imageCollections";
import Collections from "@/components/collections";
import Profile from "@/components/profile";
import { BottomNav } from "@/components/BottomNav";
import { HistoryPage, BillingPage } from "@/components/comingSoon";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { SettingsPage } from "@/components/settings";
import { useAuth } from "@/contexts/AuthContext";
import { AppShellSkeleton } from "@/components/skeletons";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getViewBreadcrumbs, type AppView } from "@/lib/app-nav";

const VALID_VIEWS: AppView[] = [
  "search",
  "uploads",
  "collections",
  "profile",
  "history",
  "analytics",
  "settings",
  "billing",
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<AppView>("search");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && VALID_VIEWS.includes(view as AppView)) {
      setActiveView(view as AppView);
    } else {
      setActiveView("search");
    }
  }, [searchParams]);

  const handleViewChange = (view: AppView) => {
    setActiveView(view);
    router.push(`/?view=${view}`);
  };

  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden app-root bg-white font-sans">
      <AppSidebar activeView={activeView} onViewChange={handleViewChange} />
      <SidebarInset className="bg-white min-w-0 flex flex-col">
        <TopBar breadcrumbs={getViewBreadcrumbs(activeView)} />
        <div
          id="main"
          className={`flex flex-1 flex-col min-w-0 min-h-0 overflow-x-hidden pb-20 md:pb-0 bg-white ${
            activeView === "collections" ? "overflow-y-hidden" : "overflow-y-auto"
          }`}
          tabIndex={-1}
        >
          <div
            className={
              activeView === "search" ||
              activeView === "uploads" ||
              activeView === "collections" ||
              activeView === "profile" ||
              activeView === "settings" ||
              activeView === "analytics" ||
              activeView === "history" ||
              activeView === "billing"
                ? "px-0 pb-0 flex-1 flex flex-col min-h-0"
                : "px-6 pb-6"
            }
          >
            {activeView === "search" ? (
              <ImageSearch />
            ) : activeView === "collections" ? (
              <Collections />
            ) : activeView === "uploads" ? (
              <ImageCollections />
            ) : activeView === "profile" ? (
              <Profile />
            ) : activeView === "history" ? (
              <HistoryPage />
            ) : activeView === "analytics" ? (
              <AnalyticsDashboard />
            ) : activeView === "settings" ? (
              <SettingsPage />
            ) : activeView === "billing" ? (
              <BillingPage />
            ) : (
              <ImageSearch />
            )}
          </div>
        </div>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}

export default function HomeClient() {
  const { loading } = useAuth();

  if (loading) {
    return <AppShellSkeleton />;
  }

  return (
    <Suspense fallback={<AppShellSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
