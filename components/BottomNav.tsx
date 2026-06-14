"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, CloudUpload, FolderOpen, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function BottomNav() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleSidebar } = useSidebar();
  const view = searchParams.get("view") ?? "search";

  const toSearch = () => router.push("/?view=search");
  const toUploads = () => router.push("/?view=uploads");
  const toCollections = () => router.push("/?view=collections");

  const isSearch = view === "search";
  const isUploads = view === "uploads";
  const isCollections = view === "collections";

  const base =
    "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors min-h-[44px] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg";

  const active = "text-cg-ink";
  const inactive = "text-cg-ink-4";

  return (
    <nav
      className="md:hidden fixed bottom-3 left-3 right-3 z-50 rounded-cta bg-cg-bg/95 backdrop-blur-xl border border-cg-line shadow-card safe-area-pb"
      aria-label="Primary"
    >
      <div className="flex">
        <button
          type="button"
          onClick={toSearch}
          className={`${base} ${isSearch ? active : inactive}`}
          aria-current={isSearch ? "page" : undefined}
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={toUploads}
          className={`${base} ${isUploads ? active : inactive}`}
          aria-current={isUploads ? "page" : undefined}
          aria-label="Uploads"
        >
          <CloudUpload className="h-5 w-5" aria-hidden />
          <span>Upload</span>
        </button>
        <button
          type="button"
          onClick={toCollections}
          className={`${base} ${isCollections ? active : inactive}`}
          aria-current={isCollections ? "page" : undefined}
          aria-label="Collections"
        >
          <FolderOpen className="h-5 w-5" aria-hidden />
          <span>Collections</span>
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          className={`${base} ${inactive}`}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
