"use client";

import { Search, FolderOpen, LogOut, User, UserCircle, AlertCircle, Loader2, History, BarChart3, Settings, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type ViewType = "search" | "collections" | "profile" | "history" | "analytics" | "settings" | "billing";

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
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className="px-4 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="font-semibold text-gray-900">Snoolink AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("search")}>
                    <Search className="h-4 w-4" />
                    <span>Semantic Search</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "collections"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("collections")}>
                    <FolderOpen className="h-4 w-4" />
                    <span>Collections</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "history"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("history")}>
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "analytics"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("analytics")}>
                    <BarChart3 className="h-4 w-4" />
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
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("settings")}>
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "billing"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600 data-[active=true]:font-medium"
                >
                  <button onClick={() => onViewChange("billing")}>
                    <CreditCard className="h-4 w-4" />
                    <span>Billing</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-xs text-purple-600 font-medium truncate">
              Pro Plan
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

