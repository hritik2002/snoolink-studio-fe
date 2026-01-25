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
    router.push("/login");
  };

  return (
    <Sidebar className="border-r border-gray-200 bg-white" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="px-2 md:px-4 py-4 md:py-6 border-b border-gray-200 flex flex-col items-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <div className="flex items-center gap-2 w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:w-full">
          <SidebarTrigger className="size-8 shrink-0" aria-label="Collapse or expand sidebar" />
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7 overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="Snoolink" 
              width={32} 
              height={32} 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-semibold text-gray-900 truncate group-data-[collapsible=icon]:hidden">Snoolink</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {!isMobile && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "search"}
                    tooltip="Search"
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
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
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
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
                    className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
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
          <SidebarGroupLabel className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2">
            Coming soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "history"}
                  tooltip="History"
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
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
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
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
          <SidebarGroupLabel className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-4 py-2">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={activeView === "settings"}
                    tooltip="Settings"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
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
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
                  >
                    <button onClick={() => handleViewChange("billing")} aria-label="Billing (coming soon)">
                      <CreditCard className="h-4 w-4 shrink-0" />
                      <span>Billing</span>
                      <span className="ml-1 text-[10px] text-gray-400 font-normal">Soon</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Admin"
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
      <SidebarFooter className="border-t border-gray-200 p-2 md:p-4">
        {/* Expanded: full footer */}
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 shrink-0">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 font-medium truncate">
                Pro
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            Sign out
          </button>
        </div>
        {/* Collapsed: icon-only Profile + Sign out */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2 py-1">
          <button
            onClick={() => handleViewChange("profile")}
            className="size-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
            title="Profile"
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="size-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
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

