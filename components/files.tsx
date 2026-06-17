"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CloudUpload, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { AppTable, type AppTableColumn } from "@/components/app/AppTable";
import { AppRowMenu } from "@/components/app/AppRowMenu";
import { StatusBadge } from "@/components/app/StatusBadge";
import { UploadVideosModal } from "@/components/UploadVideosModal";
import { appBtnPrimary, appBtnSecondary, appPageTitle } from "@/lib/app-classes";
import {
  formatDuration,
  formatRelativeTime,
  getFileName,
  truncateId,
  truncateUri,
} from "@/lib/file-format";

interface FileRow {
  id: string;
  url: string;
  type: "image" | "video";
  description?: string;
  createdAt?: string;
  collectionName: string;
  duration?: number;
  status: "ready" | "processing" | "failed";
  source: string;
  canDelete: boolean;
}

const ITEMS_PER_PAGE = 20;

export default function Files() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FileRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCollection, setUploadCollection] = useState("Default");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchFiles = useCallback(async (currentOffset: number, append: boolean) => {
    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String(currentOffset),
        type: "video",
      });

      const [resourcesRes, queueRes] = await Promise.all([
        fetch(`/api/resources?${params}`),
        currentOffset === 0 ? fetch("/api/media/processing-failed-videos") : Promise.resolve(null),
      ]);

      if (!resourcesRes.ok) throw new Error("Failed to load files");
      const resourcesData = await resourcesRes.json();

      const queueRows: FileRow[] = [];
      if (queueRes?.ok) {
        const queueData = await queueRes.json();
        if (queueData.success && queueData.data) {
          const { processing = [], failed = [] } = queueData.data;
          for (const job of processing as { id: string; videoUrl: string; timestamp?: number }[]) {
            queueRows.push({
              id: `job-${job.id}`,
              url: job.videoUrl,
              type: "video",
              createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : undefined,
              collectionName: "—",
              status: "processing",
              source: "upload",
              canDelete: false,
            });
          }
          for (const job of failed as { id: string; videoUrl: string; timestamp?: number }[]) {
            queueRows.push({
              id: `job-${job.id}`,
              url: job.videoUrl,
              type: "video",
              createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : undefined,
              collectionName: "—",
              status: "failed",
              source: "upload",
              canDelete: false,
            });
          }
        }
      }

      if (resourcesData.success) {
        const resourceRows: FileRow[] = resourcesData.data.items.map(
          (item: {
            id: string;
            url: string;
            type: "image" | "video";
            description?: string;
            collectionName?: string;
            createdAt?: string;
            duration?: number;
          }) => ({
            id: String(item.id),
            url: item.url,
            type: item.type,
            description: item.description,
            collectionName: item.collectionName || "Default",
            createdAt: item.createdAt,
            duration: item.duration,
            status: "ready" as const,
            source: "upload",
            canDelete: true,
          })
        );

        const queueUrls = new Set(queueRows.map((r) => r.url));
        const dedupedResources = resourceRows.filter((r) => !queueUrls.has(r.url));

        const merged = currentOffset === 0
          ? [...queueRows, ...dedupedResources]
          : resourceRows;

        setItems((prev) => (append ? [...prev, ...merged] : merged));
        setHasMore(resourcesData.data.hasMore);
        setOffset(currentOffset + resourcesData.data.items.length);
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
  }, [toast]);

  const refresh = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchFiles(0, false);
  }, [fetchFiles]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const add = searchParams.get("add");
    const collection = searchParams.get("collection");
    if (add === "1" || collection) {
      setUploadCollection(collection || "Default");
      setShowUploadModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchFiles(offset, true);
        }
      },
      { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, offset, fetchFiles]);

  const handleDelete = async (row: FileRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!row.canDelete) return;
    setDeletingId(row.id);
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(row.collectionName)}/resources`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceIds: [Number(row.id)] }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete file");
      toast({ title: "File removed" });
      setItems((prev) => prev.filter((i) => i.id !== row.id));
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

  const columns: AppTableColumn<FileRow>[] = [
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
        <span className="font-mono text-[13px] text-app-3">{truncateId(row.id)}</span>
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
      render: (row) => <span className="text-app-1">{getFileName(row.url)}</span>,
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
      render: (row) => <span className="text-app-2">{row.source}</span>,
    },
    {
      key: "status",
      label: "Status",
      width: "110px",
      render: (row) => {
        if (row.status === "failed") return <StatusBadge variant="error">Failed</StatusBadge>;
        if (row.status === "processing") return <StatusBadge variant="processing">Processing</StatusBadge>;
        return <StatusBadge variant="done">Ready</StatusBadge>;
      },
    },
    {
      key: "actions",
      label: "",
      width: "48px",
      render: (row) =>
        row.canDelete ? (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <AppRowMenu
              items={[
                {
                  label: "Delete",
                  variant: "danger",
                  icon:
                    deletingId === row.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    ),
                  disabled: deletingId === row.id,
                  onClick: (e) => handleDelete(row, e),
                },
              ]}
            />
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className={appPageTitle}>Files</h1>
          <button
            type="button"
            className={appBtnPrimary}
            onClick={() => {
              setUploadCollection(searchParams.get("collection") || "Default");
              setShowUploadModal(true);
            }}
          >
            <CloudUpload className="h-4 w-4" />
            Add Files
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        <AppTable
          columns={columns}
          data={items}
          loading={isLoading}
          emptyMessage="No files yet. Add files to get started."
          onRowClick={(row) => window.open(row.url, "_blank")}
        />
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          {isLoadingMore && <Loader2 className="h-5 w-5 animate-spin text-app-3" />}
        </div>
      </div>

      <UploadVideosModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={refresh}
        defaultCollection={uploadCollection}
      />
    </div>
  );
}
