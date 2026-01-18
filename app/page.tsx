"use client";

import { Suspense, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";
import ImageSearch from "@/components/imageSearch";
import ImageCollections from "@/components/imageCollections";
import Collections from "@/components/collections";
import Profile from "@/components/profile";
import { BottomNav } from "@/components/BottomNav";
import { HistoryPage, AnalyticsPage, SettingsPage, BillingPage } from "@/components/comingSoon";
import { useAuth } from "@/contexts/AuthContext";
import { AppShellSkeleton } from "@/components/skeletons";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<
    "search" | "uploads" | "collections" | "profile" | "history" | "analytics" | "settings" | "billing"
  >("search");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const view = searchParams.get("view");
    const validViews = ["search", "uploads", "collections", "profile", "history", "analytics", "settings", "billing"];
    if (view && validViews.includes(view)) {
      setActiveView(view as typeof activeView);
    } else {
      setActiveView("search");
    }
  }, [searchParams]);

  // Keep sidebar always open on desktop, allow mobile toggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop: always open
        setSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={(open) => {
      // Only allow closing on mobile
      if (window.innerWidth < 1024) {
        setSidebarOpen(open);
      } else {
        // Force open on desktop
        setSidebarOpen(true);
      }
    }}>
      <AppSidebar activeView={activeView} onViewChange={(view) => {
        setActiveView(view);
        router.push(`/?view=${view}`);
      }} />
      <SidebarInset className="bg-background">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <SidebarTrigger className="lg:hidden" aria-label="Open menu" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-foreground truncate">Snoolink Studio</span>
          </div>
        </div>

        <main id="main" className="flex flex-col h-screen overflow-auto pb-16 md:pb-0" tabIndex={-1}>
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
            <AnalyticsPage />
          ) : activeView === "settings" ? (
            <SettingsPage />
          ) : activeView === "billing" ? (
            <BillingPage />
          ) : (
            <ImageSearch />
          )}
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}

export default function Home() {
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
