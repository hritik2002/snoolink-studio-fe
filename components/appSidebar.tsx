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
    <Sidebar className="border-r border-white/10 bg-[#0a0a0a]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/60 text-xs font-normal px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={activeView === "search"}
                  className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white"
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
                  className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white"
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
                  className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/10 data-[active=true]:text-white"
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
      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10">
            <User className="h-4 w-4 text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email || "User"}
            </p>
            <p className="text-xs text-white/60 truncate">
              {user?.email?.split("@")[0] || ""}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

