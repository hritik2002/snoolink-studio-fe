"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { 
  FolderOpen, Plus, Copy, Check, Grid3X3, List,
  Video, Image as ImageIcon, ChevronLeft, ChevronRight, Loader2, X,
  SlidersHorizontal, ArrowUpDown, ExternalLink, CloudUpload, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

type SortOption = "date-desc" | "date-asc" | "name-asc" | "name-desc";
type FilterType = "all" | "image" | "video";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Sort and filter items
  const sortedAndFilteredItems = items
    .filter(item => filterType === "all" || item.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date-asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "name-asc":
          const nameA = a.url.split('/').pop()?.split('?')[0] || "";
          const nameB = b.url.split('/').pop()?.split('?')[0] || "";
          return nameA.localeCompare(nameB);
        case "name-desc":
          const nameA2 = a.url.split('/').pop()?.split('?')[0] || "";
          const nameB2 = b.url.split('/').pop()?.split('?')[0] || "";
          return nameB2.localeCompare(nameA2);
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
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || "";
    const extUpper = ext.toUpperCase();
    if (type === "video") {
      return `Video (.${ext})`;
    }
    return `Image (.${ext})`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header with Gradient Background */}
      <div className="sticky top-0 z-20 pt-4 sm:pt-6 pb-4 px-4 sm:px-6 flex-shrink-0 overflow-hidden">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.25) 0%, rgba(196, 181, 253, 0.15) 30%, rgba(233, 213, 255, 0.08) 60%, rgba(255, 255, 255, 1) 100%)',
          }}
        />
        <div className="relative z-10">
          {/* Header with Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Collections</h1>
              <p className="text-gray-600 text-xs sm:text-sm">
                Browse and organize your indexed media library.
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50 flex-1 sm:flex-initial text-xs sm:text-sm">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button size="sm" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm">
                <CloudUpload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Media</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Chips Header */}
      <div className="border-b border-gray-200 bg-white sticky top-[80px] sm:top-[104px] z-10">
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
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{collection.name}</span>
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

          {/* Sort By */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200">
                <span>
                  {sortBy === "date-desc" && "Newest First"}
                  {sortBy === "date-asc" && "Oldest First"}
                  {sortBy === "name-asc" && "Name A-Z"}
                  {sortBy === "name-desc" && "Name Z-A"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        {isLoadingItems ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
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
              <p className="text-gray-500 text-xs sm:text-sm">
                {items.length === 0 
                  ? "Upload files to this collection to see them here"
                  : "Try changing your filter or sort options"
                }
              </p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
            {sortedAndFilteredItems.map((item) => (
              <div key={item.id} className="group border border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-3 hover:border-purple-300 hover:shadow-md transition-all bg-white touch-manipulation">
                {/* Thumbnail */}
                <div className="relative aspect-video min-h-[120px] sm:min-h-0 rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {item.type === "video" ? (
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover" 
                      playsInline
                      controls
                      preload="metadata"
                      style={{ display: 'block', minHeight: '120px' }}
                      ref={(video) => {
                        if (video) {
                          video.setAttribute('webkit-playsinline', 'true');
                        }
                      }}
                    />
                  ) : (
                    <Image 
                      src={item.url} 
                      alt={item.description || "Collection item"} 
                      fill 
                      className="object-cover" 
                      unoptimized 
                    />
                  )}

                  {/* Type indicator */}
                  <div className="absolute top-2 left-2 bg-black/50 rounded-md p-1">
                    {item.type === "video" ? (
                      <Video className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>

                  {/* External link button - shows on hover/touch */}
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 hover:bg-white active:bg-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-all shadow-sm hover:shadow-md touch-manipulation"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-700" />
                  </button>
                </div>

                {/* Title */}
                <div className="mb-1 sm:mb-2">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {item.url.split('/').pop()?.split('?')[0] || "Untitled"}
                  </h3>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">{item.collectionName}</span>
                  <span className="text-xs text-purple-600 font-medium">{getFileExtension(item.url)}</span>
                </div>

                {/* Video Metadata Panel */}
                {item.type === "video" && (item.duration || item.resolution) && (
                  <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">File Type:</span>
                        <div className="text-purple-600 font-medium">{getFileType(item.url, item.type)}</div>
                      </div>
                      {item.duration && (
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <div className="text-purple-600 font-medium">{formatDuration(item.duration)}</div>
                        </div>
                      )}
                      {item.resolution && (
                        <div>
                          <span className="text-gray-500">Resolution:</span>
                          <div className="text-purple-600 font-medium">{item.resolution.replace('x', '×')}</div>
                        </div>
                      )}
                      {item.createdAt && (
                        <div>
                          <span className="text-gray-500">Upload Date:</span>
                          <div className="text-purple-600 font-medium">{formatDate(item.createdAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description with copy */}
                {item.description && (
                  <button
                    onClick={() => copyDescription(item.id, item.description!)}
                    className="w-full flex items-center gap-1 text-left group/desc"
                  >
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {item.description}
                    </p>
                    {copiedId === item.id ? (
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400 opacity-0 group-hover/desc:opacity-100 flex-shrink-0 transition-opacity" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {sortedAndFilteredItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-purple-300 hover:shadow-md transition-all group touch-manipulation"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden bg-gray-100 relative">
                  {item.type === "video" ? (
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover" 
                      playsInline
                      preload="metadata"
                      style={{ display: 'block' }}
                      ref={(video) => {
                        if (video) {
                          video.setAttribute('webkit-playsinline', 'true');
                        }
                      }}
                    />
                  ) : (
                    <Image 
                      src={item.url} 
                      alt={item.description || "Collection item"} 
                      fill 
                      className="object-cover" 
                      unoptimized 
                    />
                  )}
                  {/* Type indicator */}
                  <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5">
                    {item.type === "video" ? (
                      <Video className="h-3 w-3 text-white" />
                    ) : (
                      <ImageIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.url.split('/').pop()?.split('?')[0] || "Untitled"}
                    </h3>
                    <span className="text-xs text-purple-600 font-medium">{getFileExtension(item.url)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                    <span>{item.collectionName}</span>
                    <span className="text-gray-300">•</span>
                    <span>{item.type === "video" ? "Video" : "Image"}</span>
                  </div>
                  
                  {/* Video Metadata Panel */}
                  {item.type === "video" && (item.duration || item.resolution) && (
                    <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">File Type:</span>
                          <div className="text-purple-600 font-medium">{getFileType(item.url, item.type)}</div>
                        </div>
                        {item.duration && (
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <div className="text-purple-600 font-medium">{formatDuration(item.duration)}</div>
                          </div>
                        )}
                        {item.resolution && (
                          <div>
                            <span className="text-gray-500">Resolution:</span>
                            <div className="text-purple-600 font-medium">{item.resolution.replace('x', '×')}</div>
                          </div>
                        )}
                        {item.createdAt && (
                          <div>
                            <span className="text-gray-500">Upload Date:</span>
                            <div className="text-purple-600 font-medium">{formatDate(item.createdAt)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {item.description && (
                    <button
                      onClick={() => copyDescription(item.id, item.description!)}
                      className="flex items-center gap-1 text-left group/desc max-w-full"
                    >
                      <p className="text-xs text-gray-400 truncate">
                        {item.description}
                      </p>
                      {copiedId === item.id ? (
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <Copy className="h-3 w-3 text-gray-300 opacity-0 group-hover/desc:opacity-100 flex-shrink-0 transition-opacity" />
                      )}
                    </button>
                  )}
                </div>

                {/* External Link */}
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                  className="opacity-0 group-hover:opacity-100 active:opacity-100 sm:group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 hover:bg-purple-100 active:bg-purple-100 rounded-lg flex-shrink-0 touch-manipulation"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={loadMoreRef} className="py-8 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-sm text-gray-400">
              Showing all {totalCount} items
            </p>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Collection</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <Input
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={createCollection}
                disabled={!newCollectionName.trim() || isCreating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
