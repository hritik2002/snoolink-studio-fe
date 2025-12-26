"use client";

import { Suspense, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";
import ImageSearch from "@/components/imageSearch";
import ImageCollections from "@/components/imageCollections";
import Collections from "@/components/collections";
import Profile from "@/components/profile";
import { HistoryPage, AnalyticsPage, SettingsPage, BillingPage } from "@/components/comingSoon";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
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
      <SidebarInset className="bg-white">
        {/* Mobile Header with Hamburger */}
        <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <SidebarTrigger className="lg:hidden" />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-semibold text-gray-900 truncate">Snoolink AI</span>
          </div>
        </div>
        
        <div className="flex flex-col h-screen overflow-auto">
          {activeView === "search" ? (
            <ImageSearch />
          ) : activeView === "uploads" ? (
            <ImageCollections />
          ) : activeView === "collections" ? (
            <Collections />
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
