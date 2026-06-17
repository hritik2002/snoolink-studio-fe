"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Loader2, Pencil, Settings, Trash2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { AppTable, type AppTableColumn } from "@/components/app/AppTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ModalShell, ModalFooterActions } from "@/components/app/ModalShell";
import {
  appBtnPrimary,
  appBtnSecondary,
  appInput,
  appPageTitle,
  appSectionTitle,
} from "@/lib/app-classes";
import { appPath, collectionPath } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

interface CollectionMeta {
  id: string;
  name: string;
  imageCount: number;
  videoCount: number;
  fileCount: number;
}

interface CollectionItem {
  id: string;
  url: string;
  type: "image" | "video";
  description?: string;
  createdAt?: string;
  collectionName: string;
  duration?: number;
}

type FileStatus = "ready" | "processing" | "failed";

const ITEMS_PER_PAGE = 20;

function truncateId(id: string, len = 12): string {
  if (id.length <= len + 3) return id;
  return `${id.slice(0, len)}...`;
}

function truncateUri(url: string): string {
  const uri = `snoolink://files/${url.split("/").pop()?.split("?")[0] ?? url}`;
  if (uri.length <= 22) return uri;
  return `${uri.slice(0, 20)}...`;
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function getCollectionTypeLabel(meta: CollectionMeta | null): string {
  if (!meta) return "Collection";
  const total = meta.fileCount ?? meta.imageCount + meta.videoCount;
  if (total === 0) return "Empty Collection";
  if (meta.videoCount > 0 && meta.imageCount === 0) return "Video Collection";
  if (meta.imageCount > 0 && meta.videoCount === 0) return "Image Collection";
  return "Media Collection";
}

function getFileName(url: string): string {
  return url.split("/").pop()?.split("?")[0] || "Untitled";
}

export default function CollectionDetail({ collectionName }: { collectionName: string }) {
  const [meta, setMeta] = useState<CollectionMeta | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [processingUrls, setProcessingUrls] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState(collectionName);
  const [isRenaming, setIsRenaming] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getItemStatus = useCallback(
    (item: CollectionItem): FileStatus => {
      if (failedUrls.has(item.url)) return "failed";
      if (processingUrls.has(item.url)) return "processing";
      return "ready";
    },
    [failedUrls, processingUrls]
  );

  const fetchMeta = useCallback(async () => {
    try {
      const response = await fetch("/api/user-collections");
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data) {
        const col = data.data.find((c: { name: string }) => c.name === collectionName);
        if (col) {
          setMeta({
            id: String(col.id ?? col.name),
            name: col.name,
            imageCount: col.imageCount,
            videoCount: col.videoCount,
            fileCount: col.fileCount ?? col.imageCount + col.videoCount,
          });
        }
      }
    } catch {
      // non-fatal
    }
  }, [collectionName]);

  const fetchQueueStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/media/processing-failed-videos");
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data) {
        setFailedUrls(new Set((data.data.failed ?? []).map((j: { videoUrl: string }) => j.videoUrl)));
        setProcessingUrls(new Set((data.data.processing ?? []).map((j: { videoUrl: string }) => j.videoUrl)));
      }
    } catch {
      // non-fatal
    }
  }, []);

  const fetchItems = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(ITEMS_PER_PAGE),
          offset: String(currentOffset),
        });
        const response = await fetch(
          `/api/collections/${encodeURIComponent(collectionName)}/resources?${params}`
        );
        if (!response.ok) throw new Error("Failed to load files");
        const data = await response.json();
        if (data.success) {
          const newItems: CollectionItem[] = data.data.items.map((item: CollectionItem) => ({
            ...item,
            collectionName: item.collectionName || collectionName,
          }));
          setItems((prev) => (append ? [...prev, ...newItems] : newItems));
          setHasMore(data.data.hasMore);
          setOffset(currentOffset + newItems.length);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load files",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [collectionName, toast]
  );

  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    fetchMeta();
    fetchQueueStatus();
    fetchItems(0, false);
  }, [collectionName, fetchMeta, fetchQueueStatus, fetchItems]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchItems(offset, true);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, offset, fetchItems]);

  const handleDelete = async (item: CollectionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(item.id);
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(collectionName)}/resources`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceIds: [Number(item.id)] }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete file");
      toast({ title: "File removed" });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      fetchMeta();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === collectionName) {
      setShowRenameModal(false);
      return;
    }
    setIsRenaming(true);
    try {
      const response = await fetch(`/api/collections/${encodeURIComponent(collectionName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to rename collection");
      toast({ title: "Collection renamed" });
      setShowRenameModal(false);
      router.replace(collectionPath(trimmed));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename collection",
        variant: "destructive",
      });
    } finally {
      setIsRenaming(false);
    }
  };

  const columns: AppTableColumn<CollectionItem>[] = [
    {
      key: "thumbnail",
      label: "Thumbnail",
      width: "88px",
      render: (row) => (
        <div className="relative w-14 h-9 rounded-app-sm overflow-hidden bg-app-active shrink-0">
          {row.type === "video" ? (
            <video src={row.url} className="w-full h-full object-cover" playsInline preload="metadata" muted />
          ) : (
            <Image src={row.url} alt="" width={56} height={36} className="w-full h-full object-cover" unoptimized />
          )}
        </div>
      ),
    },
    {
      key: "id",
      label: "ID",
      width: "100px",
      render: (row) => (
        <span className="font-mono text-[13px] text-app-3">{truncateId(String(row.id))}</span>
      ),
    },
    {
      key: "uri",
      label: "URI",
      width: "140px",
      render: (row) => (
        <span className="font-mono text-[13px] text-app-3">{truncateUri(row.url)}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <span className="text-app-1">{getFileName(row.url)}</span>
      ),
    },
    {
      key: "duration",
      label: "Duration",
      width: "90px",
      render: (row) => (
        <span className="tabular-nums text-app-2">{formatDuration(row.duration)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      width: "140px",
      render: (row) => (
        <span className="text-app-3">{formatRelativeTime(row.createdAt)}</span>
      ),
    },
    {
      key: "source",
      label: "Source",
      width: "90px",
      render: () => <span className="text-app-2">upload</span>,
    },
    {
      key: "status",
      label: "Status",
      width: "110px",
      render: (row) => {
        const status = getItemStatus(row);
        if (status === "failed") {
          return <StatusBadge variant="error">Failed</StatusBadge>;
        }
        if (status === "processing") {
          return <StatusBadge variant="processing">Processing</StatusBadge>;
        }
        return <StatusBadge variant="done">Ready</StatusBadge>;
      },
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => handleDelete(row, e)}
          disabled={deletingId === row.id}
          className="p-1.5 rounded-app-sm text-app-3 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label="Delete file"
        >
          {deletingId === row.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-6 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className={appPageTitle}>{collectionName}</h1>
            <p className="text-[13px] text-app-3 mt-1">
              {meta?.id ?? "—"}
              <span className="mx-2 text-app-4">|</span>
              {getCollectionTypeLabel(meta)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              className={appBtnPrimary}
              onClick={() => router.push(appPath("uploads", { add: "1", collection: collectionName }))}
            >
              <CloudUpload className="h-4 w-4" />
              Add Files
            </button>
            <button
              type="button"
              className={appBtnSecondary}
              onClick={() => {
                setRenameValue(collectionName);
                setShowRenameModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              className={appBtnSecondary}
              onClick={() =>
                toast({ title: "Coming soon", description: "Collection settings will be available soon." })
              }
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        <h2 className={cn(appSectionTitle, "px-6 mb-3")}>Files</h2>
        <AppTable
          columns={columns}
          data={items}
          loading={isLoading}
          emptyMessage="No files yet. Add files to populate this collection."
          onRowClick={(row) => window.open(row.url, "_blank")}
        />
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-app-3" />}
        </div>
      </div>

      <ModalShell
        open={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title="Rename collection"
        width="420px"
        footer={
          <ModalFooterActions
            onCancel={() => setShowRenameModal(false)}
            onConfirm={handleRename}
            confirmLabel="Save"
            loading={isRenaming}
            confirmDisabled={!renameValue.trim() || renameValue.trim() === collectionName}
          />
        }
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className={appInput}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
          }}
        />
      </ModalShell>
    </div>
  );
}
