"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Upload, Loader2, Video, CloudUpload, Folder, 
  CheckCircle2, Clock, AlertCircle, ChevronRight, X,
  Filter, CheckSquare, Square, Trash2, RotateCcw, FileUp, ExternalLink, Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

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

export default function ImageCollections() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("Default");
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const hasAssets = files.length > 0;

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

  // Image upload handler
  const handleImageUpload = useCallback(
    async (imageFiles: File[]) => {
      const imageCount = imageFiles.length;
      setIsUploading(true);

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

        const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

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
            const { blob: processedBlob, isHEIC } = await convertToPNG(file);
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 9);
          const sanitizedName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s\-_]/g, "").replace(/\s+/g, "_").substring(0, 50);
            const publicId = `${timestamp}_${random}_${sanitizedName}`;

            const paramsToSign: Record<string, string | number> = {
              timestamp: Math.round(Date.now() / 1000),
              folder: "snoolink-studio",
              public_id: publicId,
            };
          if (isHEIC) paramsToSign.format = "jpg";

          const signatureResponse = await axios.post("/api/images/cloudinary-signature", { paramsToSign });
            const { signature } = signatureResponse.data;

            const formData = new FormData();
          const fileExtension = isHEIC ? "heic" : processedBlob.type === "image/jpeg" ? "jpg" : "png";
          const uploadBlob = processedBlob instanceof File ? processedBlob : new File([processedBlob], `${sanitizedName}.${fileExtension}`, { type: processedBlob.type });

            formData.append("file", uploadBlob);
          formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
            formData.append("timestamp", paramsToSign.timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "snoolink-studio");
            formData.append("public_id", publicId);
          if (isHEIC) formData.append("format", "jpg");

          const uploadResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
          if (!uploadResponse.data.secure_url) throw new Error("Upload failed");
            return uploadResponse.data.secure_url;
        };

        for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
          const batch = imageFiles.slice(i, i + BATCH_SIZE);
          processingToast.update({
            title: "Uploading images",
            description: `${uploadedCount}/${imageCount} images uploaded...`,
          });

          const batchResults = await Promise.allSettled(batch.map((file) => uploadSingleFile(file)));
          batchResults.forEach((result, index) => {
            if (result.status === "fulfilled") { urls.push(result.value); uploadedCount++; }
            else { errors.push(`${batch[index].name}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`); }
          });

          if (i + BATCH_SIZE < imageFiles.length) await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (urls.length > 0) {
          processingToast.update({ title: "Processing images", description: `Embedding ${urls.length} images...` });
          for (let i = 0; i < urls.length; i += EMBED_BATCH_SIZE) {
            const urlBatch = urls.slice(i, i + EMBED_BATCH_SIZE);
            await axios.post("/api/images/embed", { urls: urlBatch, collectionName: selectedCollection });
            if (i + EMBED_BATCH_SIZE < urls.length) await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        processingToast.dismiss();
        if (errors.length > 0 && urls.length === 0) {
          toast({ title: "Upload failed", description: "All images failed to upload.", variant: "destructive" });
        } else if (errors.length > 0) {
          toast({ title: "Partial success", description: `${urls.length} images uploaded. ${errors.length} failed.`, variant: "default" });
        } else {
          toast({ title: "Images uploaded", description: `Successfully uploaded ${urls.length} image${urls.length !== 1 ? "s" : ""}`, variant: "success" });
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
    async (videoFiles: File[]) => {
      const totalVideos = videoFiles.length;

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
              folder: "snoolink-studio/videos",
              public_id: publicId,
            };

            const signatureResponse = await axios.post("/api/videos/cloudinary-signature", { paramsToSign });
            const { signature } = signatureResponse.data;

            const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`;
            
            const formData = new FormData();
            formData.append("file", videoFile);
            formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
            formData.append("timestamp", paramsToSign.timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "snoolink-studio/videos");
            formData.append("public_id", publicId);

            const videoUploadResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData, { headers: { "Content-Type": "multipart/form-data" } });
            if (!videoUploadResponse.data.secure_url) throw new Error("Upload failed");

            return { success: true, videoUrl: videoUploadResponse.data.secure_url, fileName: videoFile.name };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error", fileName: videoFile.name };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter((r) => r.success);
        const failedUploads = uploadResults.filter((r) => !r.success);

        if (successfulUploads.length === 0) throw new Error("All video uploads failed");

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
        const totalFailed = failedUploads.length + processResults.filter((r) => !r.success).length;

        processingToast.dismiss();
        if (totalFailed === 0) {
          toast({ title: "Videos queued!", description: `${successfulProcesses.length} video(s) queued for processing`, variant: "success" });
        } else if (successfulProcesses.length > 0) {
          toast({ title: "Partial success", description: `${successfulProcesses.length} video(s) queued. ${totalFailed} failed.`, variant: "default" });
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
    async (fileList: FileList | File[]) => {
      const allFiles = Array.from(fileList);
      const imageFiles = allFiles.filter((file) => file.type.startsWith("image/"));
      const videoFiles = allFiles.filter((file) => file.type.startsWith("video/"));

      if (imageFiles.length === 0 && videoFiles.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please select image or video files",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        // Upload images and videos in parallel
        const uploadPromises: Promise<void>[] = [];
        
        if (imageFiles.length > 0) {
          uploadPromises.push(handleImageUpload(imageFiles));
        }
        
        if (videoFiles.length > 0) {
          uploadPromises.push(handleVideoUpload(videoFiles));
        }

        await Promise.all(uploadPromises);
      } finally {
        setIsUploading(false);
        fetchCollections();
      }
    },
    [handleImageUpload, handleVideoUpload, toast, fetchCollections]
  );

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
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFileUpload(selectedFiles);
      }
    },
    [handleFileUpload]
  );

  // Filter files
  const filteredFiles = files.filter((file) => {
    return filterStatus === "all" || file.status === filterStatus;
  });

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
    <div className="flex-1 flex flex-col h-full py-4 sm:py-6 lg:py-8 bg-white px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <span>Uploads</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Upload Queue</span>
      </div>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Upload Queue
            </h1>
            {hasAssets ? (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{files.filter(f => f.status === "processing").length}</span>
                  <span>processing</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{files.filter(f => f.status === "failed").length}</span>
                  <span>failed</span>
                </span>
                    <span>•</span>
                <span className="text-gray-500 text-xs">
                  Completed uploads appear in Collections
                </span>
              </div>
            ) : (
              <p className="text-gray-600 text-sm sm:text-base">
                Upload new files or monitor processing status. Completed files appear in Collections.
              </p>
            )}
      </div>
        </div>
      </div>

      {/* Upload Zone */}
      {(!hasAssets || showUploadZone) && (
        <div className="mb-4 sm:mb-6">
          <div
            className={`p-6 sm:p-8 border-2 border-dashed rounded-xl transition-all ${
              isDragActive
                ? "border-purple-500 bg-purple-50 border-solid scale-[1.01]"
                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/30"
            }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center text-center">
              <div className={`mb-3 p-3 rounded-full bg-purple-100 transition-transform ${isDragActive ? "scale-110" : ""}`}>
                <FileUp className={`h-8 w-8 text-purple-600 ${isDragActive ? "animate-bounce" : ""}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Upload Files
          </h3>
              <p className="text-gray-600 text-sm mb-1 max-w-md">
                Drag and drop images or videos here, or click to select from your computer.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports JPG, PNG, HEIC, MP4, MOV, AVI · Auto-indexed for semantic search
              </p>

              {/* Collection Selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Upload to:</span>
                <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                  <SelectTrigger className="w-[200px] bg-white border-gray-300">
                    <Folder className="h-4 w-4 mr-2 text-purple-600" />
                    <span className="truncate">{selectedCollection}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCollections ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        {collections.map((collection) => (
                          <SelectItem key={collection.name} value={collection.name}>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-purple-600" />
                              <span>{collection.name}</span>
                              <span className="text-xs text-gray-400">
                                ({collection.imageCount + collection.videoCount})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {collections.length === 0 && (
                          <SelectItem value="Default">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-purple-600" />
                              <span>Default</span>
                            </div>
                          </SelectItem>
                        )}
                        <div className="border-t border-gray-200 mt-1 pt-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowCreateCollectionModal(true);
                            }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
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

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
              </>
            ) : (
              <>
                      <Folder className="h-4 w-4 mr-2" />
                    Select Files
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
                accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
        </div>
      )}

      {/* Filters - Always visible */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              Filter:
            </span>
          {(["all", "processing", "failed"] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                  filterStatus === status
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] border-gray-300 bg-white text-gray-700">
            <span>SORT BY: {sortBy === "date" ? "Date Added" : "Name"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Selection Bar for Failed Files */}
      {failedFiles.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={toggleSelectAllFailed} className="flex items-center gap-2">
              {allFailedSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              <span>{allFailedSelected ? "Deselect All" : "Select All Failed"}</span>
            </Button>
            {selectedFiles.size > 0 && (
              <span className="text-sm text-gray-600">{selectedFiles.size} selected</span>
            )}
        </div>
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFailed}
                disabled={isProcessingAction}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </Button>
              <Button
                size="sm"
                onClick={handleRetryFailed}
                disabled={isProcessingAction}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                <span>Retry</span>
              </Button>
                        </div>
                      )}
                        </div>
                      )}

      {/* Files List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          {filterStatus === "processing" ? (
            <>
              <Clock className="h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-gray-900 font-medium text-lg mb-2">
                No files currently processing
              </p>
              <p className="text-gray-500 text-sm max-w-md">
                When you upload new videos, they will appear here while being indexed for semantic search. Processing typically takes up to a minute.
              </p>
            </>
          ) : filterStatus === "failed" ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-gray-900 font-medium text-lg mb-2">
                No failed uploads
              </p>
              <p className="text-gray-500 text-sm max-w-md">
                Great news! All your uploads have been processed successfully. If any uploads fail in the future, they will appear here for you to retry.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-gray-900 font-medium text-lg mb-2">
                All caught up!
              </p>
              <p className="text-gray-500 text-sm max-w-md">
                No files are currently processing or failed. Upload new files above, or head to the Collections page to browse your indexed media.
              </p>
            </>
          )}
        </div>
      ) : (
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFiles.map((file) => {
            const urlParts = file.url.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0] || (file.type === "image" ? 'image.jpg' : 'video.mp4');
            const isFailed = file.status === "failed";
            const isProcessing = file.status === "processing";
            const isSelected = selectedFiles.has(file.id);
            
            return (
              <div
                key={file.id}
                onClick={isFailed ? () => toggleFileSelection(file.id) : undefined}
                className={`flex items-center gap-4 p-4 bg-white border-2 rounded-2xl transition-all ${
                  isSelected 
                    ? "border-purple-500 bg-purple-50/30" 
                    : "border-gray-200 hover:border-purple-300 hover:shadow-md"
                } ${isFailed ? "cursor-pointer" : ""}`}
              >
                {/* Status Indicator / Selection */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isSelected 
                    ? "bg-purple-500" 
                    : isProcessing 
                      ? "bg-yellow-500" 
                      : "bg-red-500 hover:bg-red-600"
                }`}>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : isProcessing ? (
                    <Clock className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  {file.type === "video" ? (
                    <video src={file.url} className="w-full h-full object-cover" />
                  ) : (
                  <Image
                      src={file.url} 
                      alt={file.description || "Uploaded file"} 
                      width={64} 
                      height={64} 
                      className="w-full h-full object-cover" 
                    unoptimized
                  />
                  )}
                      </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-purple-600 truncate">
                    {filename}
                  </p>
                  <p className="text-sm text-gray-500">
                    {file.type === "video" ? "Video" : "Image"}
                    {isFailed && <span className="text-red-500 ml-2">• Failed</span>}
                    {file.status === "processing" && <span className="text-yellow-600 ml-2">• Processing</span>}
                  </p>
                  {file.status === "processing" && (
                    <p className="text-xs text-gray-400 mt-1">
                      Indexing in progress — this may take up to a minute
                    </p>
                  )}
                </div>

                {/* View Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(file.url, '_blank');
                  }}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4 text-purple-600" />
                </button>
              </div>
            );
          })}
          </div>
      )}

      {/* Create Collection Modal */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Collection</h2>
              <button 
                onClick={() => {
                  setShowCreateCollectionModal(false);
                  setNewCollectionName("");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
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
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isCreatingCollection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
