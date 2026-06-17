"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useToast } from "@/lib/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { ModalShell, ModalFooterActions } from "@/components/app/ModalShell";
import { appBtnPrimary, appInput } from "@/lib/app-classes";
import { APP_ROUTES } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const VIDEO_ACCEPT = "video/mp4,video/quicktime,.mp4,.mov";

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|m4v)$/i.test(file.name);
}

interface UploadVideosModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  defaultCollection?: string;
}

export function UploadVideosModal({
  open,
  onClose,
  onUploaded,
  defaultCollection = "Default",
}: UploadVideosModalProps) {
  const [collections, setCollections] = useState<string[]>(["Default"]);
  const [selectedCollection, setSelectedCollection] = useState(defaultCollection);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) setSelectedCollection(defaultCollection);
  }, [open, defaultCollection]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/user-collections")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.length) {
          setCollections(data.data.map((c: { name: string }) => c.name));
        }
      })
      .catch(() => {});
  }, [open]);

  const uploadVideos = useCallback(
    async (videoFiles: File[]) => {
      setIsUploading(true);
      const processingToast = toast({
        title: "Uploading videos",
        description: `Uploading ${videoFiles.length} video(s)...`,
      });

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        const uploadResults = await Promise.all(
          videoFiles.map(async (videoFile) => {
            try {
              const presignedResponse = await axios.post("/api/videos/s3-presigned-url", {
                fileName: videoFile.name,
                contentType: videoFile.type || "video/mp4",
              });
              const { presignedUrl, url } = presignedResponse.data;
              if (!presignedUrl || !url) throw new Error("Failed to get presigned URL");

              const uploadResponse = await fetch(presignedUrl, {
                method: "PUT",
                body: videoFile,
                headers: { "Content-Type": videoFile.type || "video/mp4" },
              });
              if (!uploadResponse.ok) throw new Error(`Upload failed (${uploadResponse.status})`);

              const processResponse = await fetch(`${backendUrl}/api/media/process-video`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ videoUrl: url, collectionName: selectedCollection }),
              });
              if (!processResponse.ok) throw new Error("Failed to queue video");

              return { success: true };
            } catch {
              return { success: false };
            }
          })
        );

        const ok = uploadResults.filter((r) => r.success).length;
        const failed = uploadResults.length - ok;
        processingToast.dismiss();

        if (ok === 0) {
          toast({ title: "Upload failed", description: "All videos failed to upload.", variant: "destructive" });
        } else if (failed > 0) {
          toast({ title: "Partial success", description: `${ok} queued, ${failed} failed.` });
        } else {
          toast({
            title: "Videos queued",
            description: `Processing in "${selectedCollection}" using its collection settings.`,
            variant: "success",
            action: <ToastAction altText="Search" onClick={() => router.push(APP_ROUTES.search)}>Search</ToastAction>,
          });
        }

        if (ok > 0) {
          onUploaded();
          onClose();
        }
      } catch (error) {
        processingToast.dismiss();
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [toast, selectedCollection, onUploaded, onClose, router]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected?.length) return;

    const videoFiles = Array.from(selected).filter(isVideoFile);
    if (videoFiles.length === 0) {
      setValidationError("Only MP4 and MOV videos are supported.");
      return;
    }
    const oversized = videoFiles.filter((f) => f.size > MAX_VIDEO_SIZE);
    if (oversized.length > 0) {
      setValidationError(`${oversized.length} video(s) exceed the 100MB limit.`);
      return;
    }
    setValidationError(null);
    uploadVideos(videoFiles);
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Add files"
      width="480px"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={() => fileInputRef.current?.click()}
          confirmLabel={isUploading ? "Uploading…" : "Select videos"}
          loading={isUploading}
        />
      }
    >
      <p className="text-[14px] text-app-3 mb-4">MP4 or MOV, max 100MB each.</p>

      <label className="text-[13px] font-medium text-app-2 mb-1.5 block">Collection</label>
      <Select value={selectedCollection} onValueChange={setSelectedCollection}>
        <SelectTrigger className={cn(appInput, "mb-4")}>
          <span>{selectedCollection}</span>
        </SelectTrigger>
        <SelectContent>
          {collections.map((name) => (
            <SelectItem key={name} value={name}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {validationError && (
        <p className="text-[13px] text-red-600 mb-2">{validationError}</p>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          appBtnPrimary,
          "w-full justify-center py-3 border border-dashed border-app-border-input bg-app-hover/50 hover:bg-app-hover"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Video className="h-4 w-4" />
        )}
        {isUploading ? "Uploading…" : "Choose video files"}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </ModalShell>
  );
}
