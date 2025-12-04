"use client";

import { Suspense, useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";
import ImageSearch from "@/components/imageSearch";
import ImageCollections from "@/components/imageCollections";
import Profile from "@/components/profile";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<
    "search" | "collections" | "profile"
  >("search");

  useEffect(() => {
    const view = searchParams.get("view");
    if (view && ["search", "collections", "profile"].includes(view)) {
      setActiveView(view as "search" | "collections" | "profile");
    } else {
      setActiveView("search");
    }
  }, [searchParams]);

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={(view) => {
        setActiveView(view);
        router.push(`/?view=${view}`);
      }} />
      <SidebarInset className="bg-[var(--background-secondary)]">
        <div className="flex flex-col h-screen overflow-auto px-8">
          {activeView === "search" ? (
            <ImageSearch />
          ) : activeView === "collections" ? (
            <ImageCollections />
          ) : (
            <Profile />
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
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
