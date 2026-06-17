"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  FolderOpen,
  Upload,
  History,
  BarChart3,
  Settings,
  CreditCard,
  User,
  Shield,
  ChevronsUpDown,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppAvatar } from "@/components/app/AppAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { appNavItem, appNavItemActive, appNavSectionLabel } from "@/lib/app-classes";
import { APP_ROUTES, appPath, type AppView } from "@/lib/app-nav";

interface JobCounts {
  total: { inProgress: number };
}

interface NavItemDef {
  view: AppView;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItemDef[];
}

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItemDef;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={appPath(item.view)}
      onClick={onNavigate}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(appNavItem, isActive && appNavItemActive)}
    >
      <span className="w-4 h-4 shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
      {item.badge}
    </Link>
  );
}

function NavSectionBlock({
  section,
  activeView,
  onNavigate,
  showSeparator,
}: {
  section: NavSection;
  activeView: AppView | null;
  onNavigate: () => void;
  showSeparator: boolean;
}) {
  return (
    <div>
      {showSeparator && <div className="h-px bg-app-border-light my-2 -mx-3" />}
      <p className={appNavSectionLabel}>{section.label}</p>
      <div className="flex flex-col gap-0.5">
        {section.items.map((item) => (
          <NavLink
            key={item.view}
            item={item}
            isActive={activeView === item.view}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [jobCounts, setJobCounts] = useState<JobCounts | null>(null);

  const activeView =
    Object.entries(APP_ROUTES).find(([, path]) => pathname === path || pathname.startsWith(`${path}/`))?.[0] as
      | AppView
      | undefined ?? null;

  const fetchJobCounts = useCallback(async () => {
    try {
      const response = await fetch("/api/media/job-counts");
      if (!response.ok) return;
      const data = await response.json();
      if (data.success) setJobCounts(data.data);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    if (user) fetchJobCounts();
    else setJobCounts(null);
  }, [user, fetchJobCounts]);

  const closeMobile = () => setOpenMobile(false);
  const displayName = user?.email?.split("@")[0] || "User";
  const inProgress = jobCounts?.total?.inProgress ?? 0;

  const uploadsBadge =
    inProgress > 0 ? (
      <span className="ml-auto text-[11px] font-medium text-app-3 tabular-nums">
        {inProgress}
      </span>
    ) : null;

  const mediaItems: NavItemDef[] = [
    { view: "search", label: "Search", icon: <Search className="w-4 h-4" /> },
    { view: "collections", label: "Collections", icon: <FolderOpen className="w-4 h-4" /> },
    {
      view: "uploads",
      label: "Uploads",
      icon: <Upload className="w-4 h-4" />,
      badge: uploadsBadge,
    },
  ];

  const activityItems: NavItemDef[] = [
    { view: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { view: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const settingsItems: NavItemDef[] = [
    { view: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { view: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
    { view: "billing", label: "Billing", icon: <CreditCard className="w-4 h-4" /> },
  ];

  const sections: NavSection[] = [
    { label: "Media", items: isMobile ? [] : mediaItems },
    { label: "Activity", items: activityItems },
    { label: "Settings", items: settingsItems },
  ].filter((s) => s.items.length > 0);

  return (
    <Sidebar className="border-r border-app-border bg-white font-sans" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="px-3 py-3.5 border-b border-app-border-light group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <Link
            href={appPath("search")}
            onClick={closeMobile}
            className="flex items-center gap-2.5 min-w-0 hover:bg-app-hover rounded-app-sm px-1.5 py-1 transition-colors duration-150 group-data-[collapsible=icon]:p-0"
          >
            <AppAvatar name={displayName} email={user?.email} />
            <span className="text-[14px] font-medium text-app-1 truncate group-data-[collapsible=icon]:hidden">
              {displayName}
            </span>
            <ChevronsUpDown className="w-4 h-4 text-app-4 shrink-0 group-data-[collapsible=icon]:hidden" />
          </Link>
          <button
            type="button"
            className="p-1.5 rounded-app-sm hover:bg-app-hover transition-colors duration-150 group-data-[collapsible=icon]:hidden"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-app-3" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 flex flex-col gap-1 overflow-y-auto">
        {sections.map((section, idx) => (
          <NavSectionBlock
            key={section.label}
            section={section}
            activeView={activeView}
            onNavigate={closeMobile}
            showSeparator={idx > 0}
          />
        ))}

        <div className="h-px bg-app-border-light my-2 -mx-3" />
        <Link
          href="/admin"
          onClick={closeMobile}
          className={cn(appNavItem, "text-app-3")}
          aria-label="Admin"
        >
          <Shield className="w-4 h-4 shrink-0" />
          <span>Admin</span>
        </Link>
      </SidebarContent>

      <SidebarFooter className="border-t border-app-border-light px-3 py-3">
        <Link
          href={appPath("profile")}
          onClick={closeMobile}
          className="flex items-center gap-2.5 w-full hover:bg-app-hover rounded-app-sm px-2 py-1.5 transition-colors duration-150 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <AppAvatar name={displayName} email={user?.email} />
          <div className="flex flex-col items-start min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-[14px] font-medium text-app-1 truncate w-full text-left">
              {displayName}
            </span>
            <span className="text-[12px] text-app-3 truncate w-full text-left">
              {user?.email}
            </span>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-app-4 shrink-0 group-data-[collapsible=icon]:hidden" />
        </Link>
        <button
          type="button"
          onClick={() => signOut().then(() => router.push("/"))}
          className="mt-2 w-full text-left text-[13px] text-app-3 hover:text-app-2 px-2 transition-colors duration-150 group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:px-0"
        >
          Sign out
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
