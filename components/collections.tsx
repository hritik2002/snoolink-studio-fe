"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import { AppTable, type AppTableColumn } from "@/components/app/AppTable";
import { FilterDropdown } from "@/components/app/FilterDropdown";
import { ModalShell, ModalFooterActions } from "@/components/app/ModalShell";
import { appBtnPrimary, appBtnSecondary, appInput, appPageTitle } from "@/lib/app-classes";
import { collectionPath } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

type CollectionTypeFilter = "all" | "video" | "image" | "empty" | "mixed";

interface CollectionRow {
  id: string;
  name: string;
  description?: string | null;
  imageCount: number;
  videoCount: number;
  fileCount: number;
  createdAt?: string | null;
}

function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 12)}...`;
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

function getCollectionType(row: CollectionRow): string {
  const total = row.fileCount ?? row.imageCount + row.videoCount;
  if (total === 0) return "Empty";
  if (row.videoCount > 0 && row.imageCount === 0) return "Video";
  if (row.imageCount > 0 && row.videoCount === 0) return "Image";
  return "Mixed";
}

function matchesTypeFilter(row: CollectionRow, filter: CollectionTypeFilter): boolean {
  if (filter === "all") return true;
  const type = getCollectionType(row).toLowerCase();
  return type === filter;
}

export default function Collections() {
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<CollectionTypeFilter>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user-collections");
      if (!response.ok) throw new Error("Failed to load collections");
      const data = await response.json();
      if (data.success && data.data) {
        setCollections(
          data.data.map((col: {
            id?: string;
            name: string;
            imageCount: number;
            videoCount: number;
            fileCount?: number;
            createdAt?: string | null;
          }) => ({
            id: String(col.id ?? col.name),
            name: col.name,
            description: null,
            imageCount: col.imageCount,
            videoCount: col.videoCount,
            fileCount: col.fileCount ?? col.imageCount + col.videoCount,
            createdAt: col.createdAt ?? null,
          }))
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  useEffect(() => {
    if (!menuOpenId) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpenId]);

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/collections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create collection");
      setShowCreateModal(false);
      setNewCollectionName("");
      toast({ title: "Collection created", description: `"${data.data.name}" is ready` });
      fetchCollections();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create collection",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCollection = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/collections/${encodeURIComponent(deleteTarget.name)}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete collection");
      toast({ title: "Collection deleted", description: `"${deleteTarget.name}" was removed` });
      setDeleteTarget(null);
      fetchCollections();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete collection",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCollections = collections.filter((row) => matchesTypeFilter(row, typeFilter));

  const columns: AppTableColumn<CollectionRow>[] = [
    {
      key: "id",
      label: "ID",
      width: "140px",
      render: (row) => (
        <span className="font-mono text-[13px] text-app-3">{truncateId(row.id)}</span>
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (row) => <span className="text-app-1 font-medium">{row.name}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="text-app-3">{row.description?.trim() || "—"}</span>
      ),
    },
    {
      key: "fileCount",
      label: "# Files",
      width: "90px",
      render: (row) => <span className="tabular-nums">{row.fileCount}</span>,
    },
    {
      key: "type",
      label: "Type",
      width: "120px",
      render: (row) => <span className="text-app-2">{getCollectionType(row)}</span>,
    },
    {
      key: "createdAt",
      label: "Created",
      width: "160px",
      render: (row) => (
        <span className="text-app-3">{formatRelativeTime(row.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "120px",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className={cn(appBtnSecondary, "h-8 px-3 text-[13px]")}
            onClick={(e) => {
              e.stopPropagation();
              router.push(collectionPath(row.name));
            }}
          >
            View
          </button>
          <div className="relative" ref={menuOpenId === row.id ? menuRef : undefined}>
            <button
              type="button"
              className={cn(appBtnSecondary, "h-8 w-8 p-0 justify-center")}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenId(menuOpenId === row.id ? null : row.id);
              }}
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpenId === row.id && (
              <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white border border-app-border-input rounded-app-md shadow-app-dropdown overflow-hidden">
                <button
                  type="button"
                  className="flex w-full px-3 py-2.5 text-[13px] text-red-600 hover:bg-red-50 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    setDeleteTarget(row);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="px-6 pt-6 pb-4">
        <h1 className={cn(appPageTitle, "mb-5")}>Collections</h1>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className={appBtnPrimary} onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            New Collection
          </button>
          <FilterDropdown
            label="Collection Type"
            value={typeFilter === "all" ? undefined : typeFilter}
            options={[
              { label: "All", value: "all" },
              { label: "Video", value: "video" },
              { label: "Image", value: "image" },
              { label: "Mixed", value: "mixed" },
              { label: "Empty", value: "empty" },
            ]}
            onChange={(v) => setTypeFilter(v as CollectionTypeFilter)}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-6">
        <AppTable
          columns={columns}
          data={filteredCollections}
          loading={isLoading}
          emptyMessage="No collections yet. Create one to get started."
          onRowClick={(row) => router.push(collectionPath(row.name))}
        />
      </div>

      <ModalShell
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewCollectionName(""); }}
        title="New collection"
        width="420px"
        footer={
          <ModalFooterActions
            onCancel={() => { setShowCreateModal(false); setNewCollectionName(""); }}
            onConfirm={createCollection}
            confirmLabel="Create"
            loading={isCreating}
            confirmDisabled={!newCollectionName.trim()}
          />
        }
      >
        <Input
          placeholder="Collection name"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          className={appInput}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && newCollectionName.trim()) createCollection();
          }}
        />
      </ModalShell>

      <ModalShell
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete collection"
        width="420px"
        footer={
          <>
            <button type="button" onClick={() => setDeleteTarget(null)} className={appBtnSecondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteCollection}
              disabled={isDeleting}
              className={cn(appBtnPrimary, "bg-red-500 hover:bg-red-600")}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </button>
          </>
        }
      >
        <p className="text-[14px] text-app-2">
          Delete <strong>{deleteTarget?.name}</strong> and all files inside it? This cannot be undone.
        </p>
      </ModalShell>
    </div>
  );
}
