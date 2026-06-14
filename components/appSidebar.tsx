"use client";

import { Search, FolderOpen, User, History, BarChart3, Settings, CreditCard, Upload, LogOut, Shield } from "lucide-react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { sidebarItem } from "@/lib/cg-classes";

type ViewType = "search" | "uploads" | "collections" | "profile" | "history" | "analytics" | "settings" | "billing";

interface AppSidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

interface JobCounts {
  images: {
    failed: number;
    inProgress: number;
  };
  videos: {
    failed: number;
    inProgress: number;
  };
  total: {
    failed: number;
    inProgress: number;
  };
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close sidebar on mobile when view changes
  const handleViewChange = (view: ViewType) => {
    onViewChange(view);
    setOpenMobile(false);
  };

  const fetchJobCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/media/job-counts");
      if (!response.ok) {
        throw new Error("Failed to fetch job counts");
      }
      const data = await response.json();
      if (data.success) {
        setJobCounts(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch job counts");
      }
    } catch (err) {
      console.error("Error fetching job counts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch job counts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch only - no polling
  useEffect(() => {
    if (user) {
      fetchJobCounts();
    } else {
      // Clear counts when user logs out
      setJobCounts(null);
      setLoading(false);
      setError(null);
    }
  }, [user, fetchJobCounts]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const navClass = cn(
    sidebarItem,
    "rounded-[10px] data-[active=true]:shadow-btn-light data-[active=true]:bg-cg-surface data-[active=true]:text-cg-ink data-[active=true]:font-medium"
  );

  return (
    <Sidebar className="border-r border-cg-line bg-cg-bg-alt/80 backdrop-blur-sm" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="px-3 md:px-4 py-4 md:py-5 border-b border-cg-line">
        <div className="flex items-center gap-2.5 w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
          <SidebarTrigger className="size-8 shrink-0 rounded-badge hover:bg-cg-bg-warm" aria-label="Collapse or expand sidebar" />
          <div className="size-8 rounded-icon flex items-center justify-center shrink-0 bg-cg-surface border border-cg-line shadow-btn-light overflow-hidden group-data-[collapsible=icon]:size-7">
            <Image 
              src="/logo.png" 
              alt="Snoolink" 
              width={32} 
              height={32} 
              className="size-full object-contain p-0.5"
            />
          </div>
          <span className="font-ui text-body font-medium text-cg-ink tracking-tight truncate group-data-[collapsible=icon]:hidden">
            Snoolink
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        {!isMobile && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "search"}
                    tooltip="Search"
                    className={navClass}
                  >
                    <button onClick={() => handleViewChange("search")} aria-label="Search">
                      <Search className="h-4 w-4 shrink-0" />
                      <span>Search</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "collections"}
                    tooltip="Collections"
                    className={navClass}
                  >
                    <button onClick={() => handleViewChange("collections")} aria-label="Collections">
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span>Collections</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "uploads"}
                    tooltip="Uploads"
                    className={navClass}
                  >
                    <button onClick={() => handleViewChange("uploads")} aria-label="Uploads">
                      <Upload className="h-4 w-4 shrink-0" />
                      <span>Uploads</span>
                      {(jobCounts?.total?.inProgress ?? 0) > 0 && (
                        <span className="ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-medium text-amber-700 group-data-[collapsible=icon]:hidden" aria-live="polite">
                          {jobCounts.total.inProgress}
                        </span>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "history"}
                  tooltip="History"
                  className={navClass}
                >
                  <button onClick={() => handleViewChange("history")} aria-label="History (coming soon)">
                    <History className="h-4 w-4 shrink-0" />
                    <span>History</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "analytics"}
                  tooltip="Analytics"
                  className={navClass}
                >
                  <button onClick={() => handleViewChange("analytics")} aria-label="Analytics">
                    <BarChart3 className="h-4 w-4 shrink-0" />
                    <span>Analytics</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "settings"}
                    tooltip="Settings"
                    className={navClass}
                  >
                    <button onClick={() => handleViewChange("settings")} aria-label="Settings">
                      <Settings className="h-4 w-4 shrink-0" />
                      <span>Settings</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "billing"}
                    tooltip="Billing"
                    className={navClass}
                  >
                    <button onClick={() => handleViewChange("billing")} aria-label="Billing (coming soon)">
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span>Billing</span>
                      <span className="nav-badge ml-1.5">Soon</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Admin"
                    className={cn(navClass, "data-[active=false]:text-cg-ink-4")}
                  >
                    <button
                      onClick={() => { setOpenMobile(false); router.push("/admin"); }}
                      aria-label="Admin"
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      <span>Admin</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-cg-line p-2 md:p-3">
        {/* Expanded: full footer */}
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="rounded-card border border-cg-line bg-cg-surface shadow-card p-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-cg-peach/40 border border-cg-orange/20 shrink-0">
                <User className="size-4 text-cg-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cg-ink truncate">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-cg-ink-4 font-medium truncate">
                  Pro
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-cg-ink-4 hover:text-cg-ink px-1 transition-colors duration-200 ease-cg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20 focus-visible:ring-offset-2 rounded-badge"
          >
            Sign out
          </button>
        </div>
        {/* Collapsed: icon-only Profile + Sign out */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2 py-1">
          <button
            onClick={() => handleViewChange("profile")}
            className="size-8 flex items-center justify-center rounded-badge hover:bg-cg-bg-warm text-cg-ink-4 hover:text-cg-ink transition-colors duration-200 ease-cg"
            title="Profile"
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="size-8 flex items-center justify-center rounded-badge hover:bg-cg-bg-warm text-cg-ink-4 hover:text-cg-ink transition-colors duration-200 ease-cg"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

