"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CloudUpload, FolderOpen, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/app-nav";

export function BottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const isSearch = pathname.startsWith(APP_ROUTES.search);
  const isUploads = pathname.startsWith(APP_ROUTES.uploads);
  const isCollections = pathname.startsWith(APP_ROUTES.collections);

  const base =
    "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border focus-visible:ring-inset rounded-app-sm";

  const active = "text-app-1";
  const inactive = "text-app-4";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-app-border bg-white safe-area-pb"
      aria-label="Primary"
    >
      <div className="flex">
        <Link
          href={APP_ROUTES.search}
          className={cn(base, isSearch ? active : inactive)}
          aria-current={isSearch ? "page" : undefined}
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden />
          <span>Search</span>
        </Link>
        <Link
          href={APP_ROUTES.uploads}
          className={cn(base, isUploads ? active : inactive)}
          aria-current={isUploads ? "page" : undefined}
          aria-label="Uploads"
        >
          <CloudUpload className="h-5 w-5" aria-hidden />
          <span>Upload</span>
        </Link>
        <Link
          href={APP_ROUTES.collections}
          className={cn(base, isCollections ? active : inactive)}
          aria-current={isCollections ? "page" : undefined}
          aria-label="Collections"
        >
          <FolderOpen className="h-5 w-5" aria-hidden />
          <span>Collections</span>
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(base, inactive)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
