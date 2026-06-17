"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Video, CloudUpload, Folder, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, X,
  Filter, CheckSquare, Square, Trash2, RotateCcw, FileUp, ExternalLink, Plus,
  Camera, FolderUp, Sparkles, Play, Pause
} from "lucide-react";
import { UploadsListSkeleton } from "@/components/skeletons";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { APP_ROUTES } from "@/lib/app-nav";

interface UploadedFile {
  id: string;
  url: string;
  type: "image" | "video";
  description?: string;
  createdAt?: string;
  status: "processing" | "failed";
  jobId?: string;
}

interface JobResponse {
  id: string;
  videoUrl: string;
  progress?: number;
  failedReason?: string;
  timestamp?: number;
}

interface UserCollection {
  name: string;
  imageCount: number;
  videoCount: number;
}

type FilterStatus = "all" | "processing" | "failed";
type SortBy = "date" | "name" | "size" | "progress";

function suggestCollectionForFiles(files: File[], collections: UserCollection[]): string | null {
  if (files.length === 0 || collections.length === 0) return null;
  const names = files.map((f) => f.name.replace(/\.[^/.]+$/, "").toLowerCase().split(/[\s_\-.,]+/)).flat();
  const seen = new Set<string>();
  for (const c of collections) {
    const tokens = c.name.toLowerCase().split(/[\s_\-.,]+/);
    for (const t of tokens) {
      if (t.length < 3) continue;
      if (names.some((n) => n.includes(t) || t.includes(n))) {
        seen.add(c.name);
        break;
      }
    }
  }
  return seen.size > 0 ? Array.from(seen)[0] : null;
}

// Helper to intelligently truncate long filenames
function truncateFilename(filename: string, maxLength = 40): { display: string; full: string } {
  if (filename.length <= maxLength) {
    return { display: filename, full: filename };
  }
  
  // Try to extract meaningful part (remove IDs at start)
  const parts = filename.split('_');
  let meaningfulPart = filename;
  
  // If filename starts with timestamp-like ID, skip it
  if (parts.length > 1 && /^\d+/.test(parts[0])) {
    meaningfulPart = parts.slice(1).join('_');
  }
  
  // Extract extension
  const lastDot = meaningfulPart.lastIndexOf('.');
  const name = lastDot > 0 ? meaningfulPart.substring(0, lastDot) : meaningfulPart;
  const ext = lastDot > 0 ? meaningfulPart.substring(lastDot) : '';
  
  // Truncate name, keep extension
  const truncatedName = name.length > (maxLength - ext.length - 3) 
    ? name.substring(0, maxLength - ext.length - 3) + '...' 
    : name;
  
  return {
    display: truncatedName + ext,
    full: filename
  };
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Helper to get file size from URL (estimate based on type)
function estimateFileSize(url: string, type: string): number {
  // This is an estimate; in production, you'd get actual size from metadata
  return type === "video" ? 15 * 1024 * 1024 : 2 * 1024 * 1024; // 15MB for video, 2MB for image
}

export default function ImageCollections() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [showPulse, setShowPulse] = useState(true);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("Default");
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [suggestedCollection, setSuggestedCollection] = useState<string | null>(null);
  const [recentUploads, setRecentUploads] = useState<{ url: string; collectionName: string; type: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const [uploadProgress, setUploadProgress] = useState<{
    files: { id: string; name: string; type: string; previewUrl: string; status: "pending" | "uploading" | "embedding" | "queuing" | "done" | "failed"; progress: number; error?: string }[];
    phase: "uploading" | "embedding" | "queuing" | "done";
    done: number;
    total: number;
    failed: number;
    failedFiles: File[];
    isPaused: boolean;
  } | null>(null);
  const isPausedRef = useRef(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [supportsFolderUpload, setSupportsFolderUpload] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshState: refreshOnboardingState, onboardingState } = useOnboarding();

  const hasAssets = files.length > 0;

  // Pre-select collection when arriving via ?collection= (e.g. from Collections "Upload to X")
  useEffect(() => {
    const c = searchParams.get("collection");
    if (c && collections.some((col) => col.name === c)) {
      setSelectedCollection(c);
    }
  }, [searchParams, collections]);

  // Fetch user collections for the dropdown
  const fetchUserCollections = useCallback(async () => {
    setIsLoadingCollections(true);
    try {
      const response = await fetch("/api/user-collections");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCollections(data.data);
          // If no collections exist, Default will be used
          if (data.data.length === 0) {
            setCollections([{ name: "Default", imageCount: 0, videoCount: 0 }]);
          }
          
          // Fetch recent uploads from the first non-empty collection for teaser
          const nonEmptyCollection = data.data.find((c: UserCollection) => (c.imageCount + c.videoCount) > 0);
          if (nonEmptyCollection) {
            try {
              const recentResponse = await fetch(`/api/collections/${encodeURIComponent(nonEmptyCollection.name)}/resources?limit=4`);
              if (recentResponse.ok) {
                const recentData = await recentResponse.json();
                if (recentData.success && recentData.data.length > 0) {
                  setRecentUploads(recentData.data.slice(0, 4).map((item: any) => ({
                    url: item.url,
                    collectionName: nonEmptyCollection.name,
                    type: item.type || 'image'
                  })));
                }
              }
            } catch (err) {
              console.error("Error fetching recent uploads:", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      // Set default collection on error
      setCollections([{ name: "Default", imageCount: 0, videoCount: 0 }]);
    } finally {
      setIsLoadingCollections(false);
    }
  }, []);

  // Create a new collection
  const handleCreateCollection = useCallback(async () => {
    if (!newCollectionName.trim()) return;
    
    setIsCreatingCollection(true);
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

      // Add to local state and select the new collection
      setCollections(prev => [...prev, { 
        name: data.data.name, 
        imageCount: 0, 
        videoCount: 0 
      }]);
      setSelectedCollection(data.data.name);
      setShowCreateCollectionModal(false);
      setNewCollectionName("");
      toast({ 
        title: "Collection created", 
        description: `"${data.data.name}" is ready for uploads` 
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create collection";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsCreatingCollection(false);
    }
  }, [newCollectionName, toast]);

  // Fetch processing and failed files only (indexed files are shown in Collections)
  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const allFiles: UploadedFile[] = [];

      // Only fetch processing/failed videos (indexed items are shown in Collections page)
      try {
        const processingFailedResponse = await fetch("/api/media/processing-failed-videos");
        if (processingFailedResponse.ok) {
          const processingFailedData = await processingFailedResponse.json();
          if (processingFailedData.success) {
            const { processing, failed } = processingFailedData.data;

            processing.forEach((job: JobResponse) => {
              allFiles.push({
                id: job.id,
                url: job.videoUrl,
                type: "video",
                description: `Processing... ${job.progress ? `${job.progress}%` : ""}`,
                status: "processing",
                jobId: job.id,
                createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : undefined,
              });
            });

            failed.forEach((job: JobResponse) => {
              allFiles.push({
                id: job.id,
                url: job.videoUrl,
                type: "video",
                description: job.failedReason || "Processing failed",
                status: "failed",
                jobId: job.id,
                createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : undefined,
              });
            });
          }
        }
      } catch (error) {
        console.error("Error fetching processing/failed videos:", error);
      }

      // Sort by creation date (newest first)
      allFiles.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setFiles(allFiles);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to load uploads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCollections();
    fetchUserCollections();
  }, [fetchCollections, fetchUserCollections]);

  useEffect(() => {
    setSupportsFolderUpload(typeof document !== "undefined" && "webkitdirectory" in document.createElement("input"));
    
    // Stop pulse after 6 seconds (3 cycles)
    const timer = setTimeout(() => setShowPulse(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Confetti animation
  const triggerConfetti = useCallback(() => {
    const colors = ["#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87"];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 4000);
    }
  }, []);

  // Image upload handler
  const handleImageUpload = useCallback(
    async (
      imageFiles: File[],
      onProgress?: (p: { phase: string; done: number; total: number; failed: number; failedFiles?: File[] }) => void
    ) => {
      const imageCount = imageFiles.length;
      setIsUploading(true);
      const failedFilesList: File[] = [];

      const processingToast = toast({
        title: "Uploading images",
        description: `Starting upload of ${imageCount} image${imageCount !== 1 ? "s" : ""}...`,
        variant: "default",
      });

      try {
        const BATCH_SIZE = 5;
        const EMBED_BATCH_SIZE = 20;
        const urls: string[] = [];
        const errors: string[] = [];
        let uploadedCount = 0;

        // S3 upload will use presigned URLs

        const convertToPNG = async (file: File): Promise<{ blob: Blob; isHEIC: boolean }> => {
          const MAX_SIZE = 10 * 1024 * 1024;
          const isHEIC = /\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif";

          if (isHEIC) {
            if (file.size > MAX_SIZE) {
              try {
                const heic2any = (await import("heic2any")).default;
                const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.7 });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                return { blob, isHEIC: false };
              } catch {
                throw new Error("HEIC file too large and conversion failed.");
              }
            }
            return { blob: file, isHEIC: true };
          }

          return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            const url = URL.createObjectURL(file);

            img.onload = async () => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) { URL.revokeObjectURL(url); reject(new Error("Failed to get canvas context")); return; }

                let width = img.width;
                let height = img.height;
                const maxDimension = 4000;

                if (width > maxDimension || height > maxDimension) {
                  if (width > height) { height = (height * maxDimension) / width; width = maxDimension; }
                  else { width = (width * maxDimension) / height; height = maxDimension; }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const blob = await new Promise<Blob>((res, rej) => {
                  canvas.toBlob((b) => b ? res(b) : rej(new Error("Failed to create blob")), "image/png", 0.9);
                });

                URL.revokeObjectURL(url);
                resolve({ blob, isHEIC: false });
              } catch (err) { URL.revokeObjectURL(url); reject(err); }
            };

            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
            img.src = url;
          });
        };

        const uploadSingleFile = async (file: File): Promise<string> => {
            const { blob: processedBlob } = await convertToPNG(file);
            
            // Get presigned URL from backend
            const fileExtension = processedBlob.type === "image/jpeg" ? "jpg" : "png";
            const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.${fileExtension}`;
            
            const presignedResponse = await axios.post("/api/images/s3-presigned-url", {
              fileName,
              contentType: processedBlob.type || "image/png"
            });

            const { presignedUrl, url } = presignedResponse.data;

            if (!presignedUrl || !url) {
              throw new Error("Failed to get presigned URL");
            }

            // Upload to S3 using presigned URL
            const uploadBlob = processedBlob instanceof File ? processedBlob : new File([processedBlob], fileName, { type: processedBlob.type });
            
            const uploadResponse = await fetch(presignedUrl, {
              method: "PUT",
              body: uploadBlob,
              headers: {
                "Content-Type": processedBlob.type || "image/png",
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }

            return url;
        };

        for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
          while (isPausedRef.current) {
            await new Promise((r) => setTimeout(r, 300));
          }
          const batch = imageFiles.slice(i, i + BATCH_SIZE);
          onProgress?.({ phase: "uploading", done: uploadedCount, total: imageCount, failed: errors.length });
          processingToast.update({
            title: "Uploading images",
            description: `${uploadedCount}/${imageCount} images uploaded...`,
          });

          const batchResults = await Promise.allSettled(batch.map((file) => uploadSingleFile(file)));
          batchResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              urls.push(result.value);
              uploadedCount++;
            } else {
              errors.push(`${batch[index].name}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
              failedFilesList.push(batch[index]);
            }
          });
          onProgress?.({ phase: "uploading", done: uploadedCount, total: imageCount, failed: errors.length, failedFiles: failedFilesList });

          if (i + BATCH_SIZE < imageFiles.length) await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (urls.length > 0) {
          onProgress?.({ phase: "embedding", done: 0, total: urls.length, failed: errors.length });
          processingToast.update({ title: "Processing images", description: `Embedding ${urls.length} images...` });
          for (let i = 0; i < urls.length; i += EMBED_BATCH_SIZE) {
            const urlBatch = urls.slice(i, i + EMBED_BATCH_SIZE);
            await axios.post("/api/images/embed", { urls: urlBatch, collectionName: selectedCollection });
            onProgress?.({ phase: "embedding", done: Math.min(i + EMBED_BATCH_SIZE, urls.length), total: urls.length, failed: errors.length });
            if (i + EMBED_BATCH_SIZE < urls.length) await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        onProgress?.({ phase: "done", done: uploadedCount, total: imageCount, failed: errors.length, failedFiles: failedFilesList });
        processingToast.dismiss();
        if (errors.length > 0 && urls.length === 0) {
          toast({ title: "Upload failed", description: "All images failed to upload.", variant: "destructive" });
        } else if (errors.length > 0) {
          toast({
            title: "Partial success",
            description: `${urls.length} images uploaded. ${errors.length} failed.`,
            variant: "default",
            action: <ToastAction altText="Try searching" onClick={() => router.push(APP_ROUTES.search)}>Try searching →</ToastAction>,
          });
        } else {
          triggerConfetti();
          toast({
            title: "Images uploaded",
            description: "Searchable in a moment. Try searching.",
            variant: "success",
            action: <ToastAction altText="Try searching" onClick={() => router.push(APP_ROUTES.search)}>Try searching →</ToastAction>,
          });
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        processingToast.dismiss();
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to upload images", variant: "destructive" });
      }
    },
    [toast, selectedCollection]
  );

  // Video upload handler
  const handleVideoUpload = useCallback(
    async (
      videoFiles: File[],
      onProgress?: (p: { phase: string; done: number; total: number; failed: number; failedFiles?: File[] }) => void
    ) => {
      const totalVideos = videoFiles.length;
      onProgress?.({ phase: "uploading", done: 0, total: totalVideos, failed: 0 });

      const processingToast = toast({
        title: "Uploading videos",
        description: `Starting upload of ${totalVideos} video(s)...`,
        variant: "default",
      });

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        processingToast.update({ title: "Uploading videos", description: `Uploading ${totalVideos} video(s)...` });

        const uploadPromises = videoFiles.map(async (videoFile) => {
          try {
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 9);
            const sanitizedName = videoFile.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_").substring(0, 50);
            const publicId = `${timestamp}_${random}_${sanitizedName}`;

            const paramsToSign: Record<string, string | number> = {
              timestamp: Math.round(Date.now() / 1000),
              folder: "snoolink-studio",
              public_id: publicId,
            };

            // Get presigned URL from backend
            const presignedResponse = await axios.post("/api/videos/s3-presigned-url", {
              fileName: videoFile.name,
              contentType: videoFile.type || "video/mp4"
            });

            const { presignedUrl, url } = presignedResponse.data;

            if (!presignedUrl || !url) {
              throw new Error("Failed to get presigned URL");
            }

            // Upload directly to S3 using presigned URL
            const uploadResponse = await fetch(presignedUrl, {
              method: "PUT",
              body: videoFile,
              headers: {
                "Content-Type": videoFile.type || "video/mp4",
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }

            return { success: true, videoUrl: url, fileName: videoFile.name };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error", fileName: videoFile.name };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter((r) => r.success);
        const failedUploads = uploadResults.filter((r) => !r.success);
        const failedFilesList = failedUploads
          .map((fu) => videoFiles.find((vf) => vf.name === fu.fileName))
          .filter((f): f is File => !!f);
        onProgress?.({ phase: "uploading", done: successfulUploads.length, total: totalVideos, failed: failedUploads.length, failedFiles: failedFilesList });

        if (successfulUploads.length === 0) throw new Error("All video uploads failed");

        onProgress?.({ phase: "queuing", done: successfulUploads.length, total: totalVideos, failed: failedUploads.length });
        processingToast.update({ title: "Queueing videos", description: `Queueing ${successfulUploads.length} video(s) for processing...` });

        const processPromises = successfulUploads.map(async (uploadResult) => {
          try {
            const processResponse = await fetch(`${backendUrl}/api/media/process-video`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ videoUrl: uploadResult.videoUrl, collectionName: selectedCollection }),
            });
            if (!processResponse.ok) throw new Error("Failed to queue video");
            return { success: true, fileName: uploadResult.fileName };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error", fileName: uploadResult.fileName };
          }
        });

        const processResults = await Promise.all(processPromises);
        const successfulProcesses = processResults.filter((r) => r.success);
        const processFailedFiles = processResults
          .filter((r) => !r.success)
          .map((r) => videoFiles.find((vf) => vf.name === (r as { fileName?: string }).fileName))
          .filter((f): f is File => !!f);
        const totalFailed = failedUploads.length + processResults.filter((r) => !r.success).length;
        onProgress?.({
          phase: "done",
          done: successfulProcesses.length,
          total: totalVideos,
          failed: totalFailed,
          failedFiles: [...failedFilesList, ...processFailedFiles],
        });

        processingToast.dismiss();
        if (totalFailed === 0) {
          triggerConfetti();
          toast({
            title: "Videos queued",
            description: "Searchable in ~1 min. Try searching →",
            variant: "success",
            action: <ToastAction altText="Try searching" onClick={() => router.push(APP_ROUTES.search)}>Try searching →</ToastAction>,
          });
        } else if (successfulProcesses.length > 0) {
          toast({
            title: "Partial success",
            description: `${successfulProcesses.length} video(s) queued. ${totalFailed} failed.`,
            variant: "default",
            action: <ToastAction altText="Try searching" onClick={() => router.push(APP_ROUTES.search)}>Try searching →</ToastAction>,
          });
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Video upload error:", error);
        processingToast.dismiss();
        toast({ title: "Upload failed", description: error instanceof Error ? error.message : "Failed to upload videos", variant: "destructive" });
      }
    },
    [toast, selectedCollection]
  );

  // Unified file upload handler - automatically detects file type
  const handleFileUpload = useCallback(
    async (fileList: FileList | File[], forRetry?: boolean) => {
      const allFiles = Array.from(fileList);
      const imageFiles = allFiles.filter((f) => f.type.startsWith("image/"));
      const videoFiles = allFiles.filter((f) => f.type.startsWith("video/"));

      if (imageFiles.length === 0 && videoFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please select image or video files",
          variant: "destructive",
        });
        return;
      }

      if (!forRetry) {
        const sug = suggestCollectionForFiles(allFiles, collections);
        setSuggestedCollection(sug);
      }

      const total = imageFiles.length + videoFiles.length;
      const previewFiles = allFiles.map((f, i) => ({
        id: `up-${Date.now()}-${i}`,
        name: f.name,
        type: f.type,
        previewUrl: URL.createObjectURL(f),
        status: "pending" as const,
        progress: 0,
      }));
      setUploadProgress({
        files: previewFiles,
        phase: "uploading",
        done: 0,
        total,
        failed: 0,
        failedFiles: [],
        isPaused: false,
      });
      setIsUploading(true);
      isPausedRef.current = false;

      const onProgressImage = (p: { phase: string; done: number; total: number; failed: number; failedFiles?: File[] }) => {
        setUploadProgress((prev) => {
          if (!prev) return null;
          const merged = [...prev.failedFiles, ...(p.failedFiles || [])];
          return {
            ...prev,
            phase: p.phase as "uploading" | "embedding" | "queuing" | "done",
            done: p.done,
            total,
            failed: merged.length,
            failedFiles: merged,
          };
        });
      };
      const onProgressVideo = (p: { phase: string; done: number; total: number; failed: number; failedFiles?: File[] }) => {
        setUploadProgress((prev) => {
          if (!prev) return null;
          const merged = [...prev.failedFiles, ...(p.failedFiles || [])];
          return {
            ...prev,
            phase: (p.phase === "queuing" ? "queuing" : p.phase) as "uploading" | "embedding" | "queuing" | "done",
            done: imageFiles.length + p.done,
            total,
            failed: merged.length,
            failedFiles: merged,
          };
        });
      };

      try {
        if (imageFiles.length > 0) {
          await handleImageUpload(imageFiles, onProgressImage);
        }
        if (videoFiles.length > 0) {
          await handleVideoUpload(videoFiles, onProgressVideo);
        }
      } finally {
        setIsUploading(false);
        fetchCollections();
        setUploadProgress((prev) => (prev ? { ...prev, phase: "done" } : null));
        
        // Refresh onboarding state after successful upload
        refreshOnboardingState().catch(console.error);
        
        // Celebrate first upload
        const wasFirstUpload = !onboardingState?.hasUploaded;
        if (wasFirstUpload && (imageFiles.length > 0 || videoFiles.length > 0)) {
          toast({
            title: "🎉 Great! Your media is being indexed",
            description: "Try searching for it in a moment. Your media will be searchable by meaning!",
            duration: 6000,
            action: (
              <ToastAction altText="Go to search" onClick={() => router.push(APP_ROUTES.search)}>
                Search Now
              </ToastAction>
            ),
          });
        }
        
        setTimeout(() => {
          setUploadProgress(null);
          previewFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        }, 2500);
      }
    },
    [handleImageUpload, handleVideoUpload, toast, fetchCollections, collections]
  );

  const handleRetryFromProgress = useCallback(() => {
    const failed = uploadProgress?.failedFiles ?? [];
    setUploadProgress(null);
    if (failed.length > 0) handleFileUpload(failed, true);
  }, [uploadProgress?.failedFiles, handleFileUpload]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFileUpload(droppedFiles);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
    
    // Real-time validation on drag
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (e.dataTransfer.items) {
      const files = Array.from(e.dataTransfer.items)
        .filter(item => item.kind === 'file')
        .map(item => item.getAsFile())
        .filter((f): f is File => f !== null);
      
      const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        setValidationError(`${oversized.length} file(s) exceed 100MB limit. Please compress or split large files.`);
      } else {
        setValidationError(null);
      }
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    setValidationError(null);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        setSelectedFileCount(selected.length);
        setTimeout(() => setSelectedFileCount(0), 3000);
        handleFileUpload(selected);
      }
      e.target.value = "";
    },
    [handleFileUpload]
  );

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        const arr = Array.from(selected).filter(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        if (arr.length > 0) {
          setSelectedFileCount(arr.length);
          setTimeout(() => setSelectedFileCount(0), 3000);
          handleFileUpload(arr);
        } else {
          toast({ title: "No media in folder", description: "Select a folder with images or videos.", variant: "destructive" });
        }
      }
      e.target.value = "";
    },
    [handleFileUpload, toast]
  );

  const handleCameraSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const selected = e.target.files;
      if (selected && selected.length > 0) {
        setSelectedFileCount(selected.length);
        setTimeout(() => setSelectedFileCount(0), 3000);
        handleFileUpload(selected);
      }
      e.target.value = "";
    },
    [handleFileUpload]
  );

  // Filter files
  const filteredFiles = files.filter((file) => {
    return filterStatus === "all" || file.status === filterStatus;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "name": {
        const nameA = a.url.split('/').pop()?.split('?')[0] || '';
        const nameB = b.url.split('/').pop()?.split('?')[0] || '';
        return nameA.localeCompare(nameB);
      }
      case "size": {
        const sizeA = estimateFileSize(a.url, a.type);
        const sizeB = estimateFileSize(b.url, b.type);
        return sizeB - sizeA;
      }
      case "progress": {
        const progressA = fileProgress[a.id] || (a.status === "processing" ? 50 : a.status === "failed" ? 0 : 100);
        const progressB = fileProgress[b.id] || (b.status === "processing" ? 50 : b.status === "failed" ? 0 : 100);
        return progressB - progressA;
      }
      case "date":
      default: {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    }
  });

  // Calculate progress stats
  const processingCount = files.filter(f => f.status === "processing").length;
  const failedCount = files.filter(f => f.status === "failed").length;
  const totalProgress = files.length > 0 ? Math.round((files.filter(f => f.status !== "processing" && f.status !== "failed").length / files.length) * 100) : 0;

  // Get failed files for selection
  const failedFiles = filteredFiles.filter((f) => f.status === "failed");
  const allFailedSelected = failedFiles.length > 0 && failedFiles.every((f) => selectedFiles.has(f.id));

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) newSet.delete(fileId);
      else newSet.add(fileId);
      return newSet;
    });
  };

  const toggleSelectAllFailed = () => {
    if (allFailedSelected) {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        failedFiles.forEach((f) => newSet.delete(f.id));
        return newSet;
      });
    } else {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        failedFiles.forEach((f) => newSet.add(f.id));
        return newSet;
      });
    }
  };

  useEffect(() => {
    setSelectedFiles(new Set());
  }, [filterStatus]);

  const handleRemoveFailed = async () => {
    const selectedFailedFiles = failedFiles.filter((f) => selectedFiles.has(f.id));
    if (selectedFailedFiles.length === 0) return;

    const jobIds = selectedFailedFiles.map((f) => f.jobId || f.id).filter(Boolean);
    setIsProcessingAction(true);
    try {
      const response = await fetch("/api/media/remove-failed-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Removed", description: `Removed ${data.data?.removedCount || 0} failed upload(s)` });
        setSelectedFiles(new Set());
        fetchCollections();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to remove", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRetryFailed = async () => {
    const selectedFailedFiles = failedFiles.filter((f) => selectedFiles.has(f.id));
    if (selectedFailedFiles.length === 0) return;

    const jobIds = selectedFailedFiles.map((f) => f.jobId || f.id).filter(Boolean);
    setIsProcessingAction(true);
    try {
      const response = await fetch("/api/media/requeue-failed-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Retrying", description: `Re-queued ${data.data.results.length} upload(s)` });
        setSelectedFiles(new Set());
        fetchCollections();
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to retry", variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white">
      <div className="flex-shrink-0 border-b border-app-border-light bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[22px] font-bold text-app-1 leading-[1.3] tracking-[-0.01em]">
              Uploads
            </h1>
            {hasAssets && (
              <div className="flex items-center gap-3 text-[13px] text-app-3">
                {processingCount > 0 && (
                  <span>
                    <span className="font-medium text-app-1 tabular-nums">{processingCount}</span>{" "}
                    processing
                  </span>
                )}
                {failedCount > 0 && (
                  <span>
                    <span className="font-medium text-red-600 tabular-nums">{failedCount}</span> failed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">

      {files.length > 0 && (processingCount > 0 || failedCount > 0) && (
        <div className="mb-6 glue-card p-4 relative backdrop-blur-3xl">          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-muted-foreground">Queue progress</span>
            <span className="font-mono text-xl font-bold text-primary">{totalProgress}%</span>
          </div>
          <div className="h-1 bg-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {(!hasAssets || showUploadZone) && (
        <div className="mb-4 sm:mb-6">
          <div
            ref={dropZoneRef}
            className={`relative p-4 sm:p-6 md:p-8 border-2 border-dashed rounded-none transition-all ${
              isDragActive
                ? "border-primary bg-primary/5 border-solid scale-[1.01] ring-4 ring-primary/40/40 dropzone-active"
                : `border-primary/40 bg-muted/30/50 hover:border-primary hover:bg-primary/5/40 hover:ring-2 hover:ring-primary/30/50 ${showPulse ? "dropzone-pulse" : ""}`
            } focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            tabIndex={0}
            role="button"
            aria-label="Upload files by clicking or dragging them here"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            {/* Drop here overlay */}
            {isDragActive && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 backdrop-blur-sm">
                <p className="text-primary font-medium">Drop to upload</p>
              </div>
            )}
        <div className="flex flex-col items-center justify-center text-center py-6">
              <FileUp className="h-8 w-8 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasAssets ? "Upload files" : "Upload media"}
          </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Drag and drop or click to select. JPG, PNG, HEIC, WebP, MP4, MOV — max 100MB.
              </p>
              
              {/* Validation error warning */}
              {validationError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 max-w-md animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700">{validationError}</p>
                    <p className="text-xs text-red-600 mt-0.5">Compress files or split into smaller uploads</p>
                  </div>
                  <button onClick={() => setValidationError(null)} className="text-red-600 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              {/* Selected file count indicator */}
              {selectedFileCount > 0 && (
                <div className="mb-3 px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold animate-in fade-in slide-in-from-bottom-2">
                  {selectedFileCount} file{selectedFileCount !== 1 ? "s" : ""} selected
                </div>
              )}
              {suggestedCollection && (
                <button
                  type="button"
                  onClick={() => { setSelectedCollection(suggestedCollection); setSuggestedCollection(null); }}
                  className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested: {suggestedCollection}
                </button>
              )}

              {/* Collection Selector */}
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 sm:mb-4 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-muted-foreground">Upload to:</span>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-card border-border text-sm">
                    <Folder className="h-4 w-4 mr-2 text-primary" />
                    <span className="truncate">{selectedCollection}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCollections ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {collections.map((collection) => (
                          <SelectItem key={collection.name} value={collection.name}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-primary" />
                              <span>{collection.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({collection.imageCount + collection.videoCount})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {collections.length === 0 && (
                          <SelectItem value="Default">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-primary" />
                              <span>Default</span>
                            </div>
                          </SelectItem>
                        )}
                        <div className="border-t border-border mt-1 pt-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowCreateCollectionModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create new collection</span>
                          </button>
                        </div>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {(collections.length === 0 || (collections.length === 1 && collections[0].name === "Default")) && (
                <p className="text-xs text-muted-foreground mb-3 text-center">Default is a catch‑all when you have no collections. Create one to organize.</p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 active:bg-primary/80 text-white touch-manipulation font-semibold text-base px-6 py-3 h-12"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Uploading...</span>
                      <span className="sm:hidden">Uploading</span>
                    </>
                  ) : (
                    <>
                      <Folder className="h-5 w-5 mr-2" />
                      Select Files
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline font-medium">Also:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-border touch-manipulation h-10 w-10"
                    title="Upload a whole folder (supported in Chrome, Edge)"
                    aria-label="Upload folder"
                  >
                    <FolderUp className="h-5 w-5 text-primary" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-border touch-manipulation h-10 w-10"
                    title="Take photo or record video (mobile)"
                    aria-label="Take photo or record video"
                  >
                    <Camera className="h-5 w-5 text-primary" />
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFolderSelect}
                {...(supportsFolderUpload ? { webkitDirectory: true } : {})}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraSelect}
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload progress panel */}
      {uploadProgress && (
        <div className="mb-4 sm:mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">
              {uploadProgress.phase === "embedding"
                ? "Indexing for search…"
                : uploadProgress.phase === "queuing"
                  ? "Queueing videos…"
                  : uploadProgress.phase === "done"
                    ? "Done"
                    : "Uploading…"}
            </span>
            <span className="text-xs text-muted-foreground">
              {uploadProgress.done}/{uploadProgress.total}
              {uploadProgress.failed > 0 && ` · ${uploadProgress.failed} failed`}
            </span>
          </div>
          {(uploadProgress.phase === "embedding" || uploadProgress.phase === "queuing") && (
            <p className="text-xs text-muted-foreground mb-2">Usually ready in under a minute.</p>
          )}
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.total ? (uploadProgress.done / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto">
            {uploadProgress.files.slice(0, 12).map((f) => (
              <div
                key={f.id}
                className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 border border-border"
              >
                {f.type.startsWith("image/") ? (
                  <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {uploadProgress.files.length > 12 && (
              <span className="self-center text-xs text-muted-foreground">+{uploadProgress.files.length - 12}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {uploadProgress.phase === "uploading" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { isPausedRef.current = true; setUploadProgress((p) => (p ? { ...p, isPaused: true } : null)); }}
                  className="text-xs"
                >
                  Pause
                </Button>
                {uploadProgress.isPaused && (
                  <Button
                    size="sm"
                    onClick={() => { isPausedRef.current = false; setUploadProgress((p) => (p ? { ...p, isPaused: false } : null)); }}
                    className="text-xs bg-primary"
                  >
                    Resume
                  </Button>
                )}
              </>
            )}
            {uploadProgress.phase === "done" && uploadProgress.failedFiles.length > 0 && (
              <Button size="sm" onClick={handleRetryFromProgress} className="text-xs bg-primary">
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry {uploadProgress.failedFiles.length} failed
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">Adding to {selectedCollection}</span>
          </div>
        </div>
      )}

      {/* Interactive Tour overlay with highlights */}
      {tourStep !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          {/* Spotlight effect on targeted element */}
          <div 
            className="absolute pointer-events-none transition-all duration-500"
            style={{
              top: tourStep === 1 && dropZoneRef.current ? `${dropZoneRef.current.getBoundingClientRect().top - 8}px` : '0',
              left: tourStep === 1 && dropZoneRef.current ? `${dropZoneRef.current.getBoundingClientRect().left - 8}px` : '0',
              width: tourStep === 1 && dropZoneRef.current ? `${dropZoneRef.current.getBoundingClientRect().width + 16}px` : '0',
              height: tourStep === 1 && dropZoneRef.current ? `${dropZoneRef.current.getBoundingClientRect().height + 16}px` : '0',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px 4px rgba(168, 85, 247, 0.5)',
              borderRadius: '16px',
            }}
          />
          
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-md w-full mx-4">
            <div className="bg-popover rounded-none border border-border shadow-2xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom-4">
              {tourStep === 1 && (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FileUp className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Step 1: Add files</h3>
                        <p className="text-xs text-muted-foreground">1 of 3</p>
                      </div>
                    </div>
                    <button onClick={() => setTourStep(null)} className="text-muted-foreground hover:text-muted-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">Drag and drop images or videos, or tap <strong>Select Files</strong>. You can also upload a folder or use your camera on mobile.</p>
                </>
              )}
              {tourStep === 2 && (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Folder className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Step 2: Choose a collection</h3>
                        <p className="text-xs text-muted-foreground">2 of 3</p>
                      </div>
                    </div>
                    <button onClick={() => setTourStep(null)} className="text-muted-foreground hover:text-muted-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">Pick which collection to add uploads to. We'll suggest one when your filenames match (e.g. <strong>&quot;mumbai-travel&quot;</strong>).</p>
                </>
              )}
              {tourStep === 3 && (
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Step 3: Search by meaning</h3>
                        <p className="text-xs text-muted-foreground">3 of 3</p>
                      </div>
                    </div>
                    <button onClick={() => setTourStep(null)} className="text-muted-foreground hover:text-muted-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-sm">Once indexed, search in <strong>Search</strong> by meaning (e.g. <strong>&quot;person walking at sunset&quot;</strong>). Images are ready in seconds; videos in ~1 minute.</p>
                </>
              )}
              <div className="flex justify-between items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => tourStep > 1 ? setTourStep((s) => (s ?? 2) - 1) : setTourStep(null)}
                  className="text-muted-foreground"
                >
                  {tourStep > 1 ? "Back" : "Skip"}
                </Button>
                <div className="flex gap-1">
                  {[1, 2, 3].map((step) => (
                    <div 
                      key={step} 
                      className={`h-1.5 w-8 rounded-full transition-colors ${step === tourStep ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <Button 
                  size="sm"
                  onClick={() => tourStep < 3 ? setTourStep((s) => (s ?? 1) + 1) : setTourStep(null)} 
                  className="bg-primary hover:bg-primary/90"
                >
                  {tourStep < 3 ? "Next" : "Got it"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Sticky and always visible */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl py-3 mb-6 border-b border-border -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-foreground/80 font-semibold flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <span className="hidden sm:inline">Filter:</span>
            </span>
          {(["all", "processing", "failed"] as FilterStatus[]).map((status) => {
            const count = status === "all" 
              ? files.length 
              : files.filter(f => f.status === status).length;
            const isDisabled = files.length === 0;
            
            return (
              <button
                key={status}
                onClick={() => !isDisabled && setFilterStatus(status)}
                disabled={isDisabled}
                title={isDisabled ? "Upload files to use filters" : undefined}
                className={`px-3 py-1.5 text-[13px] font-medium border transition-colors touch-manipulation ${
                  isDisabled
                    ? "border-border text-white/30 cursor-not-allowed"
                    : filterStatus === status
                      ? "border-primary bg-primary/10 text-primary cursor-pointer"
                      : "border-border text-muted-foreground hover:text-foreground/80 cursor-pointer"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                {!isDisabled && <span className="ml-1.5 text-xs">({count})</span>}
              </button>
            );
          })}
          </div>
          <div className={files.length === 0 ? "opacity-50 pointer-events-none" : ""}>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-full sm:w-[200px] border-border bg-input text-foreground/80 text-xs sm:text-sm">
              <span className="hidden sm:inline font-medium">SORT: </span>
              <span>
                {sortBy === "date" ? "Date Added" : 
                 sortBy === "name" ? "Name" : 
                 sortBy === "size" ? "File Size" : 
                 "Progress"}
              </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">File Size</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Selection Bar for Failed Files */}
      {failedFiles.length > 0 && (
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-muted/30 border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={toggleSelectAllFailed} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm touch-manipulation">
              {allFailedSelected ? <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">{allFailedSelected ? "Deselect All" : "Select All Failed"}</span>
              <span className="sm:hidden">{allFailedSelected ? "Deselect" : "Select All"}</span>
            </Button>
            {selectedFiles.size > 0 && (
              <span className="text-xs sm:text-sm text-muted-foreground">{selectedFiles.size} selected</span>
            )}
        </div>
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFailed}
                disabled={isProcessingAction}
                className="flex items-center gap-1.5 sm:gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 text-xs sm:text-sm touch-manipulation flex-1 sm:flex-initial"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Remove</span>
              </Button>
              <Button
                size="sm"
                onClick={handleRetryFailed}
                disabled={isProcessingAction}
                className="flex items-center gap-1.5 sm:gap-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-xs sm:text-sm touch-manipulation flex-1 sm:flex-initial"
              >
                {isProcessingAction ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span>Retry</span>
              </Button>
                        </div>
                      )}
        </div>
      )}

      {/* Files List */}
      {isLoading ? (
        <UploadsListSkeleton />
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="glue-card max-w-md w-full p-8 relative">            {filterStatus === "processing" ? (
              <>
                <Clock className="h-8 w-8 text-primary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-1">Nothing processing</p>
                <p className="text-[13px] text-muted-foreground">New uploads appear here while indexing.</p>
              </>
            ) : filterStatus === "failed" ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-1">No failed uploads</p>
                <p className="text-[13px] text-muted-foreground">All uploads processed successfully.</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-lg font-medium text-foreground mb-1">All caught up</p>
                <p className="text-[13px] text-muted-foreground mb-6">Upload files above, then search by meaning.</p>
                {recentUploads.length > 0 && (
                  <div className="mb-6 w-full">
                    <p className="text-[13px] text-muted-foreground mb-3">Recent from {recentUploads[0].collectionName}</p>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {recentUploads.map((upload, idx) => (
                        <div key={idx} className="aspect-square overflow-hidden border border-border">
                          <Image 
                            src={upload.url} 
                            alt="Recent upload" 
                            width={120} 
                            height={120} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                            quality={85}
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="beetle"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    Select files
                  </Button>
                  <Link href={APP_ROUTES.collections}>
                    <Button variant="beetle-tertiary">Collections</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sortedFiles.map((file) => {
            const urlParts = file.url.split('/');
            const fullFilename = urlParts[urlParts.length - 1].split('?')[0] || (file.type === "image" ? 'image.jpg' : 'video.mp4');
            const { display: filename, full: fullname } = truncateFilename(fullFilename, 45);
            const isFailed = file.status === "failed";
            const isProcessing = file.status === "processing";
            const isSelected = selectedFiles.has(file.id);
            const estimatedSize = estimateFileSize(file.url, file.type);
              
              return (
              <div
                key={file.id}
                onClick={isFailed ? () => toggleFileSelection(file.id) : undefined}
                className={`flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 bg-card border-2 rounded-xl sm:rounded-2xl transition-all touch-manipulation animate-in fade-in slide-in-from-bottom-2 ${
                  isSelected 
                    ? "border-primary bg-primary/5/30" 
                    : "border-border hover:border-primary/30 hover:shadow-md active:border-primary/40"
                } ${isFailed ? "cursor-pointer" : ""}`}
              >
                {/* Status Indicator / Selection */}
                <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors ${
                  isSelected 
                    ? "bg-primary" 
                    : isProcessing 
                      ? "bg-yellow-500" 
                      : "bg-red-500 hover:bg-red-600 active:bg-red-700"
                }`}>
                  {isSelected ? (
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  ) : isProcessing ? (
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white animate-spin" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  )}
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted">
                  {file.type === "video" ? (
                    <video
                      src={file.url} 
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
                      src={file.url} 
                      alt={file.description || "Uploaded file"} 
                      width={64} 
                      height={64} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      quality={85}
                      unoptimized
                  />
                  )}
                        </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p 
                    className="text-sm sm:text-base font-medium text-primary truncate group relative cursor-help"
                    title={fullname !== filename ? fullname : undefined}
                  >
                      {filename}
                    {fullname !== filename && (
                      <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-secondary text-white text-xs px-3 py-2 rounded whitespace-nowrap z-20 shadow-lg max-w-sm truncate">
                        {fullname}
                      </span>
                    )}
                    </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span>{file.type === "video" ? "Video" : "Image"}</span>
                    <span>•</span>
                    <span className="text-muted-foreground">{formatFileSize(estimatedSize)}</span>
                    {isFailed && (
                      <>
                        <span>•</span>
                        <span className="text-red-500 font-medium">Failed</span>
                      </>
                    )}
                    {isProcessing && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-600 font-medium">Processing</span>
                      </>
                    )}
                  </div>
                  {isProcessing && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-300 animate-pulse"
                            style={{ width: `${fileProgress[file.id] || 45}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-yellow-600 tabular-nums min-w-[3ch]">
                          {fileProgress[file.id] || 45}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Indexing... ~{Math.max(1, Math.ceil((100 - (fileProgress[file.id] || 45)) / 50))} min remaining
                      </p>
                    </div>
                  )}
                  {isFailed && file.description && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <p className="text-red-700 font-medium mb-0.5">Upload failed</p>
                      <p className="text-red-600 line-clamp-1">{file.description}</p>
                      <p className="text-red-500 mt-1">Click to select and retry</p>
                    </div>
                  )}
          </div>

                {/* View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                  className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/10 hover:bg-primary/20 active:bg-primary/30 flex items-center justify-center transition-colors touch-manipulation"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </button>
              </div>
              );
            })}
          </div>
      )}

      {/* Create Collection Modal */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-none sm:rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Create Collection</h2>
              <button 
                onClick={() => {
                  setShowCreateCollectionModal(false);
                  setNewCollectionName("");
                }}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new collection to organize your uploads.
            </p>
            <Input
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCollectionName.trim()) {
                  handleCreateCollection();
                }
              }}
            />
            <div className="flex justify-end gap-2">
            <Button
              variant="outline"
                onClick={() => {
                  setShowCreateCollectionModal(false);
                  setNewCollectionName("");
                }}
              >
                Cancel
            </Button>
              <Button 
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || isCreatingCollection}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreatingCollection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
                      </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
