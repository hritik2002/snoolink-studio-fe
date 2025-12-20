"use client";

import { Search, FolderOpen, LogOut, User, UserCircle } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface AppSidebarProps {
  activeView: "search" | "collections" | "profile";
  onViewChange: (view: "search" | "collections" | "profile") => void;
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <Sidebar className="border-r-2 border-gray-300 bg-white shadow-sm">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs font-normal px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "search"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
                >
                  <button onClick={() => onViewChange("search")}>
                    <Search className="h-4 w-4" />
                    <span>Search</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "collections"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
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
                  isActive={activeView === "profile"}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-purple-50 data-[active=true]:text-purple-600"
                >
                  <button onClick={() => onViewChange("profile")}>
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email?.split("@")[0] || ""}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

