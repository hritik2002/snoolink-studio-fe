"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderOpen, Plus, Copy, Check, Grid3X3, List,
  Video, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, X,
  SlidersHorizontal, ArrowUpDown, ExternalLink, CloudUpload,
  CheckSquare, Square, FolderInput, Trash2, Share2, Tag, Sparkles, Clock,
  ZoomIn, ZoomOut, Maximize2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc" | "viewCount-desc" | "relevance";
type FilterType = "all" | "image" | "video";
type DateFilter = "all" | "7d" | "30d" | "year";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { CollectionsPageSkeleton, CollectionsItemsSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  count: number;
}

interface CollectionItem {
  id: string;
  url: string;
  type: "image" | "video";
  description?: string;
  createdAt?: string;
  collectionName: string;
  duration?: number;
  resolution?: string;
}

const ITEMS_PER_PAGE = 20;

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<CollectionItem | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hoverPreviewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detailVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { state: sidebarState, isMobile } = useSidebar();

  // Measure fixed header height for content padding
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(180);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const toId = (item: CollectionItem) => String(item.id);

  // Date filter
  const inDateRange = (createdAt?: string) => {
    if (dateFilter === "all" || !createdAt) return true;
    const t = new Date(createdAt).getTime();
    const now = Date.now();
    if (dateFilter === "7d") return now - t <= 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === "30d") return now - t <= 30 * 24 * 60 * 60 * 1000;
    if (dateFilter === "year") return new Date(createdAt).getFullYear() === new Date().getFullYear();
    return true;
  };

  // Sort and filter items
  const sortedAndFilteredItems = items
    .filter((item) => (filterType === "all" || item.type === filterType) && inDateRange(item.createdAt))
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name-asc": {
          const na = a.url.split("/").pop()?.split("?")[0] || "";
          const nb = b.url.split("/").pop()?.split("?")[0] || "";
          return na.localeCompare(nb);
        }
        case "name-desc": {
          const na2 = a.url.split("/").pop()?.split("?")[0] || "";
          const nb2 = b.url.split("/").pop()?.split("?")[0] || "";
          return nb2.localeCompare(na2);
        }
        case "viewCount-desc":
        case "relevance":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  // Fetch paginated items using collection-specific endpoint
  const fetchItems = useCallback(async (
    collection: string | null, 
    currentOffset: number, 
    type: FilterType,
    append: boolean = false
  ) => {
    if (!collection) return;
    
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingItems(true);
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", ITEMS_PER_PAGE.toString());
      params.append("offset", currentOffset.toString());
      if (type !== "all") {
        params.append("type", type);
      }

      // Use collection-specific endpoint
      const response = await fetch(`/api/collections/${encodeURIComponent(collection)}/resources?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newItems: CollectionItem[] = data.data.items.map((item: {
            id: string;
            url: string;
            type: "image" | "video";
            description?: string;
            collectionName?: string;
            createdAt?: string;
            duration?: number;
            resolution?: string;
          }) => ({
            id: item.id,
            url: item.url,
            type: item.type,
            description: item.description,
            collectionName: item.collectionName || collection,
            createdAt: item.createdAt,
            duration: item.duration,
            resolution: item.resolution,
          }));

          if (append) {
            setItems(prev => [...prev, ...newItems]);
          } else {
            setItems(newItems);
          }
          
          setHasMore(data.data.hasMore);
          setTotalCount(data.data.total);
          setOffset(currentOffset + newItems.length);
        }
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoadingItems(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Fetch collections list
  const fetchCollections = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use the user-collections API to get collection names with counts
      const response = await fetch("/api/user-collections");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const collectionsList: Collection[] = data.data.map((col: { name: string; imageCount: number; videoCount: number }) => ({
            id: col.name,
            name: col.name,
            count: col.imageCount + col.videoCount
          }));

          setCollections(collectionsList);
          
          // Select first collection by default
          if (collectionsList.length > 0 && !selectedCollection) {
            setSelectedCollection(collectionsList[0].name);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCollection]);

  // Load more items (for infinite scroll)
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore || !hasMore || !selectedCollection) return;
    fetchItems(selectedCollection, offset, filterType, true);
  }, [isLoadingMore, hasMore, selectedCollection, offset, filterType, fetchItems]);

  // Reset and fetch when collection or filter changes
  useEffect(() => {
    if (selectedCollection) {
      setItems([]);
      setOffset(0);
      setHasMore(true);
      fetchItems(selectedCollection, 0, filterType, false);
    }
  }, [selectedCollection, filterType, fetchItems]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingItems) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingItems, loadMoreItems]);

  // Measure fixed header for content padding
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderHeight(el.offsetHeight));
    ro.observe(el);
    setHeaderHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [selectedIds.size]);

  useEffect(() => {
    if (!detailItem) return;
    setImageZoom(1);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailItem]);

  const copyDescription = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: "Copied!", description: "Description copied to clipboard" });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const scrollChips = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await fetch("/api/collections/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create collection");
      }

      // Add to local state with data from server
      const newCollection: Collection = {
        id: data.data.name,
        name: data.data.name,
        count: 0
      };
      setCollections(prev => [...prev, newCollection]);
      setSelectedCollection(data.data.name);
      setShowCreateModal(false);
      setNewCollectionName("");
      toast({ title: "Collection created", description: `"${data.data.name}" is ready` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create collection";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const getFileExtension = (url: string) => {
    const ext = url.split('.').pop()?.split('?')[0]?.toUpperCase();
    return ext || "FILE";
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  const getFileType = (url: string, type: "image" | "video"): string => {
    const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    if (type === "video") return `Video (.${ext})`;
    return `Image (.${ext})`;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectAllOnPage = () => {
    const onPage = sortedAndFilteredItems.map(toId);
    const all = onPage.every((id) => selectedIds.has(id));
    setSelectedIds((s) => {
      const n = new Set(s);
      if (all) onPage.forEach((id) => n.delete(id));
      else onPage.forEach((id) => n.add(id));
      return n;
    });
  };

  const handleMove = async () => {
    if (!moveTarget || selectedIds.size === 0) return;
    setIsBulkActioning(true);
    try {
      const res = await fetch(`/api/collections/${encodeURIComponent(moveTarget)}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceIds: Array.from(selectedIds).map((id) => Number(id)),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Move failed");
      toast({ title: "Moved", description: `${selectedIds.size} item(s) moved to ${moveTarget}` });
      setShowMoveModal(false);
      setMoveTarget("");
      setSelectedIds(new Set());
      if (selectedCollection) {
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchItems(selectedCollection, 0, filterType, false);
      }
      fetchCollections();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Move failed", variant: "destructive" });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!selectedCollection || selectedIds.size === 0) return;
    setShowRemoveConfirm(false);
    const ids = Array.from(selectedIds);
    setIsBulkActioning(true);
    try {
      const res = await fetch(`/api/collections/${encodeURIComponent(selectedCollection)}/resources`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceIds: ids.map((id) => Number(id)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");
      toast({ title: "Removed", description: `${ids.length} item(s) removed from collection` });
      setSelectedIds(new Set());
      if (selectedCollection) {
        setItems([]);
        setOffset(0);
        setHasMore(true);
        fetchItems(selectedCollection, 0, filterType, false);
      }
      fetchCollections();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Remove failed", variant: "destructive" });
    } finally {
      setIsBulkActioning(false);
    }
  };

  const handleDetailDownload = (item: CollectionItem) => {
    const name = item.url.split("/").pop()?.split("?")[0] || (item.type === "image" ? "image.jpg" : "video.mp4");
    const a = document.createElement("a");
    a.href = item.url;
    a.download = name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Download started", description: "If it opened in a new tab, use the browser’s save option." });
  };

  const handleDetailCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast({ title: "Link copied", description: "Paste anywhere to share." }),
      () => toast({ title: "Couldn’t copy", variant: "destructive" })
    );
  };

  const handleDetailShare = async (item: CollectionItem) => {
    const name = item.url.split("/").pop()?.split("?")[0] || "Media";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, url: item.url });
        toast({ title: "Shared" });
      } catch (e) {
        if ((e as Error).name !== "AbortError") handleDetailCopyLink(item.url);
      }
    } else {
      handleDetailCopyLink(item.url);
    }
  };

  if (isLoading) {
    return <CollectionsPageSkeleton />;
  }

  const fixedHeaderLeft =
    isMobile ? "0" : (sidebarState === "collapsed" ? "var(--sidebar-width-icon)" : "var(--sidebar-width)");

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-white overflow-hidden">
      {/* Fixed header: title, actions, chips, filters, bulk — only the items area scrolls */}
      <div
        ref={headerRef}
        className="fixed top-0 right-0 z-30 bg-white"
        style={{ left: fixedHeaderLeft }}
      >
        {/* Header with Premium Gradient Background */}
        <div className="pt-4 sm:pt-6 pb-4 px-4 sm:px-6 overflow-hidden relative backdrop-blur-sm">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, 
                var(--page-accent-primary) / 0.15 0%, 
                var(--page-accent-secondary) / 0.10 30%, 
                var(--page-accent-tertiary) / 0.05 60%, 
                var(--background) 100%)`,
            }}
          />
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 20%, var(--page-accent-primary) 0%, transparent 40%),
                                  radial-gradient(circle at 80% 80%, var(--page-accent-secondary) 0%, transparent 40%)`,
              }}
            />
          </div>
          <div className="relative z-10 page-animate-fade">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div>
                <h1 className={cn(
                  "text-3xl sm:text-4xl font-bold mb-2",
                  "font-[var(--page-font)]",
                  "bg-gradient-to-r from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)]",
                  "bg-clip-text text-transparent"
                )}>
                  Collections
                </h1>
                <p className={cn(
                  "text-muted-foreground text-sm sm:text-base",
                  "font-[var(--page-font)] font-medium"
                )}>
                  Indexed media you can search.
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {selectedCollection && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 border-purple-300 text-gray-900 hover:bg-purple-50"
                  onClick={() => setShowShareModal(true)}
                  aria-label="Share collection"
                >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  className={cn(
                    "flex items-center gap-2",
                    "page-button-premium",
                    "text-white flex-1 sm:flex-initial text-xs sm:text-sm",
                    "font-[var(--page-font)] font-semibold"
                  )}
                  onClick={() =>
                    router.push(
                      selectedCollection
                        ? `/?view=uploads&collection=${encodeURIComponent(selectedCollection)}`
                        : "/?view=uploads"
                    )
                  }
                  aria-label="Upload media to this collection"
                >
                  <CloudUpload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Media</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Chips + Filters */}
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollChips("left")}
              className="flex-shrink-0 w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            {/* Scrollable Collection Chips */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.name)}
                className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all touch-manipulation ${
                  selectedCollection === collection.name
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                }`}
              >
                <span className="truncate max-w-[70px] xs:max-w-[90px] sm:max-w-[120px] md:max-w-[150px]">{collection.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCollection === collection.name
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-200 text-gray-500"
                }`}>
                  {collection.count}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollChips("right")}
            className="flex-shrink-0 w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

          {/* New Collection Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="outline"
            className="flex-shrink-0 border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 active:bg-purple-100 text-xs sm:text-sm touch-manipulation"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">New Collection</span>
            <span className="sm:hidden">New</span>
          </Button>
          <button
            type="button"
            onClick={() => toast({ title: "Coming soon", description: "AI grouping (e.g. by scene, faces) will be available soon." })}
            className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Create from AI"
          >
            <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">From AI</span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

          {/* Filter by Type */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-[100px] h-8 text-xs border-gray-200">
                <span>{filterType === "all" ? "All Types" : filterType === "image" ? "Images" : "Videos"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date facet */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="h-4 w-4 text-gray-400" />
            {(["all", "7d", "30d", "year"] as DateFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  dateFilter === d ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d === "all" ? "All" : d === "7d" ? "7d" : d === "30d" ? "30d" : "Year"}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-8 text-xs border-gray-200">
                <span>
                  {sortBy === "date-desc" && "Newest First"}
                  {sortBy === "date-asc" && "Oldest First"}
                  {sortBy === "name-asc" && "Name A-Z"}
                  {sortBy === "name-desc" && "Name Z-A"}
                  {sortBy === "viewCount-desc" && "Most Viewed"}
                  {sortBy === "relevance" && "AI Relevance"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="viewCount-desc">Most Viewed</SelectItem>
                <SelectItem value="relevance">AI Relevance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 flex-shrink-0" />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>

        {/* Bulk actions bar — fixed when visible */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-purple-50 border-b border-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={selectAllOnPage}
                className="text-xs text-purple-600 hover:underline"
              >
                {sortedAndFilteredItems.every((i) => selectedIds.has(toId(i))) ? "Deselect page" : "Select page"}
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" onClick={() => { setMoveTarget(""); setShowMoveModal(true); }} disabled={isBulkActioning} className="gap-1">
                <FolderInput className="h-3.5 w-3.5" /> Move
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRemoveConfirm(true)} disabled={isBulkActioning} className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
              <button
                type="button"
                onClick={() => toast({ title: "Coming soon", description: "Bulk tagging will be available soon." })}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Coming soon"
              >
                <Tag className="h-3.5 w-3.5" /> Tag (soon)
              </button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area — only this section scrolls; padding-top clears the fixed header */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6"
        style={{ paddingTop: (headerHeight || 180) + 12 }}
      >
        {isLoadingItems ? (
          <CollectionsItemsSkeleton />
        ) : sortedAndFilteredItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-12 sm:py-16">
            <div className="text-center max-w-md px-4">
              <div className="mx-auto mb-4 sm:mb-6 p-4 sm:p-6 rounded-full bg-purple-50 w-fit">
                <FolderOpen className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {items.length === 0 
                  ? (selectedCollection ? `No items in "${selectedCollection}"` : "No collection selected")
                  : "No items match your filters"
                }
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-4">
                {items.length === 0 
                  ? "Upload files to this collection to see them here"
                  : "Try changing your filter or sort options"
                }
              </p>
              {items.length === 0 && selectedCollection && (
                <Button
                  size="sm"
                  className="bg-[#7c3aed] hover:bg-purple-700 text-white"
                  onClick={() => router.push(`/?view=uploads&collection=${encodeURIComponent(selectedCollection)}`)}
                >
                  <CloudUpload className="h-4 w-4 mr-2" />
                  Upload to {selectedCollection}
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
            {sortedAndFilteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="group border border-gray-200 rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 hover:border-purple-300 hover:shadow-md transition-all bg-white touch-manipulation cursor-pointer min-w-0 w-full"
              >
                <div
                  className="relative aspect-video min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] rounded-lg overflow-hidden bg-muted mb-2 xs:mb-2.5 sm:mb-3 max-w-full"
                  onMouseEnter={(e) => {
                    const v = e.currentTarget.querySelector("video");
                    if (v) {
                      if (hoverPreviewTimeout.current) {
                        clearTimeout(hoverPreviewTimeout.current);
                        hoverPreviewTimeout.current = null;
                      }
                      v.muted = true;
                      v.currentTime = 0;
                      v.play().catch(() => {});
                      hoverPreviewTimeout.current = setTimeout(() => {
                        v.pause();
                        hoverPreviewTimeout.current = null;
                      }, 2500);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hoverPreviewTimeout.current) {
                      clearTimeout(hoverPreviewTimeout.current);
                      hoverPreviewTimeout.current = null;
                    }
                    const v = e.currentTarget.querySelector("video");
                    if (v) {
                      v.pause();
                      v.currentTime = 0;
                    }
                  }}
                >
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover min-h-0"
                      playsInline
                      controls
                      preload="metadata"
                      style={{ display: "block" }}
                      ref={(el) => el?.setAttribute("webkit-playsinline", "true")}
                    />
                  ) : (
                    <Image src={item.url} alt={item.description || "Collection item"} fill className="object-cover" loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={85} unoptimized />
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleSelect(toId(item)); }}
                      className="p-0.5 rounded bg-white/90 hover:bg-white text-gray-700"
                      aria-label={selectedIds.has(toId(item)) ? "Deselect" : "Select"}
                    >
                      {selectedIds.has(toId(item)) ? <CheckSquare className="h-4 w-4 text-purple-600" /> : <Square className="h-4 w-4" />}
                    </button>
                    <div className="bg-black/50 rounded-md p-1">
                      {item.type === "video" ? <Video className="h-3.5 w-3.5 text-white" /> : <ImageIcon className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(item.url, "_blank"); }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 hover:bg-white active:bg-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-all shadow-sm hover:shadow-md touch-manipulation"
                    title="Open in new tab"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                  </button>
                </div>
                {item.type === "video" && (item.duration || item.resolution) && (
                  <div className="mb-1.5 xs:mb-2 p-1.5 xs:p-2 bg-muted rounded-lg border border-border text-[10px] xs:text-xs grid grid-cols-2 gap-1.5 xs:gap-2">
                    {item.duration && <div><span className="text-muted-foreground">Duration:</span><div className="font-medium">{formatDuration(item.duration)}</div></div>}
                    {item.resolution && <div className="min-w-0"><span className="text-muted-foreground">Resolution:</span><div className="font-medium truncate">{item.resolution.replace("x", "×")}</div></div>}
                    {item.createdAt && <div className="min-w-0"><span className="text-muted-foreground">Upload Date:</span><div className="font-medium truncate">{formatDate(item.createdAt)}</div></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sortedAndFilteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-purple-300 hover:shadow-md transition-all group touch-manipulation cursor-pointer"
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleSelect(toId(item)); }}
                  className="p-1 rounded flex-shrink-0 text-gray-600 hover:bg-gray-100"
                  aria-label={selectedIds.has(toId(item)) ? "Deselect" : "Select"}
                >
                  {selectedIds.has(toId(item)) ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                </button>
                <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden bg-muted relative">
                  {item.type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" playsInline preload="metadata" style={{ display: "block" }} ref={(el) => el?.setAttribute("webkit-playsinline", "true")} />
                  ) : (
                    <Image src={item.url} alt={item.description || "Collection item"} fill className="object-cover" loading="lazy" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={85} unoptimized />
                  )}
                  <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5">
                    {item.type === "video" ? <Video className="h-3 w-3 text-white" /> : <ImageIcon className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground truncate">{item.url.split("/").pop()?.split("?")[0] || "Untitled"}</h3>
                  </div>
                  {item.type === "video" && (item.duration || item.resolution) && (
                    <div className="mb-2 p-2 bg-muted rounded-lg border border-border text-xs grid grid-cols-2 gap-2">
                      {item.duration && <div><span className="text-muted-foreground">Duration:</span><div className="font-medium">{formatDuration(item.duration)}</div></div>}
                      {item.resolution && <div><span className="text-muted-foreground">Resolution:</span><div className="font-medium">{item.resolution.replace("x", "×")}</div></div>}
                      {item.createdAt && <div><span className="text-muted-foreground">Upload Date:</span><div className="font-medium">{formatDate(item.createdAt)}</div></div>}
                    </div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); window.open(item.url, "_blank"); }} className="opacity-0 group-hover:opacity-100 active:opacity-100 sm:group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 hover:bg-purple-100 rounded-lg flex-shrink-0 touch-manipulation" title="Open in new tab" aria-label="Open in new tab">
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-8">
          {isLoadingMore && (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-lg sm:rounded-xl p-2 xs:p-2.5 sm:p-3 border border-gray-200 min-w-0">
                  <Skeleton className="aspect-video min-h-[100px] xs:min-h-[120px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] w-full rounded-lg mb-2 xs:mb-2.5 sm:mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-1 xs:mb-1.5 sm:mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-sm text-gray-400 text-center">
              Showing all {totalCount} items
            </p>
          )}
        </div>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Collection</h2>
              <button onClick={() => { setShowCreateModal(false); setNewCollectionName(""); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Parent collection (nested): Coming soon</p>
            <Input
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowSmartModal(true); setShowCreateModal(false); }} className="gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Smart collection
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={createCollection} disabled={!newCollectionName.trim() || isCreating} className="bg-[#7c3aed] hover:bg-purple-700">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSmartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Smart Collection</h2>
            <p className="text-sm text-gray-500 mb-4">Auto-populate from filters (e.g. &quot;All videos with snow&quot;). Coming soon.</p>
            <Button onClick={() => { setShowSmartModal(false); setShowCreateModal(true); }} variant="outline">Back</Button>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Move to collection</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedIds.size} item(s) will be moved and will leave the current collection.</p>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger className="w-full mb-4">
                <span className={!moveTarget ? "text-muted-foreground" : ""}>{moveTarget || "Select collection"}</span>
              </SelectTrigger>
              <SelectContent>
                {collections.filter((c) => c.name !== selectedCollection).map((c) => (
                  <SelectItem key={c.id} value={c.name}>{c.name} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowMoveModal(false); setMoveTarget(""); }}>Cancel</Button>
              <Button onClick={handleMove} disabled={!moveTarget || isBulkActioning} className="bg-[#7c3aed]">
                {isBulkActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Move
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && selectedCollection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Share &quot;{selectedCollection}&quot;</h2>
            <p className="text-sm text-gray-500 mb-4">View-only and Can edit permissions. Invite by link or email. Coming soon.</p>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>Close</Button>
          </div>
        </div>
      )}

      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Remove from collection</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedIds.size} item(s) will be removed from this collection and will no longer appear here.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>Cancel</Button>
              <Button onClick={handleRemoveFromCollection} disabled={isBulkActioning} className="bg-red-600 hover:bg-red-700 text-white">
                {isBulkActioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (() => {
        const idx = sortedAndFilteredItems.findIndex((i) => toId(i) === toId(detailItem));
        const prevItem = idx > 0 ? sortedAndFilteredItems[idx - 1] : null;
        const nextItem = idx >= 0 && idx < sortedAndFilteredItems.length - 1 ? sortedAndFilteredItems[idx + 1] : null;
        return (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            {/* Top bar */}
            <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2 bg-black/50 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                {prevItem ? (
                  <button onClick={() => setDetailItem(prevItem)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
                ) : <span className="w-8" />}
                {nextItem ? (
                  <button onClick={() => setDetailItem(nextItem)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
                ) : <span className="w-8" />}
                <h2 id="detail-title" className="font-medium text-white truncate">{detailItem.url.split("/").pop()?.split("?")[0] || "Untitled"}</h2>
              </div>
              <div className="flex items-center gap-1">
                {detailItem.type === "image" && (
                  <>
                    <button onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.25))} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
                    <span className="text-xs text-white/80 min-w-[3rem] text-center">{Math.round(imageZoom * 100)}%</span>
                    <button onClick={() => setImageZoom((z) => Math.min(3, z + 0.25))} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
                    <button onClick={() => setImageZoom(1)} className="p-1.5 rounded hover:bg-white/10 text-white text-xs">Fit</button>
                  </>
                )}
                {detailItem.type === "video" && (
                  <button onClick={() => detailVideoRef.current?.requestFullscreen?.()} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Fullscreen"><Maximize2 className="h-4 w-4" /></button>
                )}
                <button onClick={() => window.open(detailItem.url, "_blank")} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Open in new tab"><ExternalLink className="h-4 w-4" /></button>
                <button onClick={() => handleDetailDownload(detailItem)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Download"><Download className="h-4 w-4" /></button>
                <button onClick={() => handleDetailCopyLink(detailItem.url)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Copy link"><Copy className="h-4 w-4" /></button>
                <button onClick={() => handleDetailShare(detailItem)} className="p-1.5 rounded hover:bg-white/10 text-white" aria-label="Share"><Share2 className="h-4 w-4" /></button>
                <button onClick={() => setDetailItem(null)} className="p-1.5 rounded hover:bg-white/10 text-white ml-1" aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
            </div>

            {/* Media area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-0">
              {detailItem.type === "video" ? (
                <video
                  ref={detailVideoRef}
                  src={detailItem.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  playsInline
                  preload="auto"
                  autoPlay
                />
              ) : (
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detailItem.url}
                    alt={detailItem.description || "Media"}
                    className="max-w-full max-h-[70vh] object-contain select-none"
                    style={{ transform: `scale(${imageZoom})`, transformOrigin: "center" }}
                    draggable={false}
                  />
                </div>
              )}
            </div>

            {/* Bottom: caption, tags, comments, export */}
            <div className="flex-shrink-0 border-t border-white/10 bg-black/50 p-4 max-h-[40vh] overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-4">
                <div>
                  <p className="text-xs text-white/50 mb-0.5">{detailItem.type === "video" ? "Video" : "Image"} · {detailItem.collectionName}{detailItem.createdAt ? ` · Added ${formatDate(detailItem.createdAt)}` : ""}{detailItem.type === "video" && detailItem.duration != null ? ` · ${formatDuration(detailItem.duration)}` : ""}</p>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider mt-2 mb-1">Caption</p>
                  <p className="text-sm text-white">{detailItem.description || "No caption."}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => window.open(detailItem.url, "_blank")}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open in new tab</Button>
                    <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => handleDetailDownload(detailItem)}><Download className="h-3.5 w-3.5 mr-1" /> Download</Button>
                    <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => handleDetailCopyLink(detailItem.url)}><Copy className="h-3.5 w-3.5 mr-1" /> Copy link</Button>
                    <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-0" onClick={() => handleDetailShare(detailItem)}><Share2 className="h-3.5 w-3.5 mr-1" /> Share</Button>
                  </div>
                </div>
                <details className="text-white/50">
                  <summary className="text-xs font-medium text-white/60 cursor-pointer list-none">More (coming soon)</summary>
                  <p className="mt-2 text-xs text-white/40">Crop, AI captions, tags, comments, edit metadata, Open in Adobe, Post to social.</p>
                </details>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
