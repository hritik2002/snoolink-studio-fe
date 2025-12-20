"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Upload, Loader2, Image as ImageIcon, Video, CloudUpload, Folder, 
  CheckCircle2, Clock, AlertCircle, Sparkles, ChevronRight, X,
  Filter, Grid3x3, List as ListIcon, Plus, Link as LinkIcon
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

type Mode = "image" | "video";

interface CollectionImage {
  id: string;
  imageUrl: string;
  description?: string;
  uploadedAt?: string;
  status?: "indexed" | "processing" | "failed";
}

interface CollectionVideo {
  id: string;
  videoUrl: string;
  description?: string;
  createdAt?: string;
  status?: "indexed" | "processing" | "failed";
}

type FilterStatus = "all" | "indexed" | "processing" | "failed";
type ViewMode = "grid" | "list";

export default function ImageCollections() {
  const [mode, setMode] = useState<Mode>("image");
  const [images, setImages] = useState<CollectionImage[]>([]);
  const [videos, setVideos] = useState<CollectionVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviews, setVideoPreviews] = useState<Map<number, string>>(new Map());
  const [sortBy, setSortBy] = useState("date");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Determine if we should show collapsed upload (when assets exist)
  const hasAssets = mode === "image" ? images.length > 0 : videos.length > 0;

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const resourceType = mode === "video" ? "video" : "image";
      const response = await fetch(`/api/images/collections?type=${resourceType}`);
      if (response.ok) {
        const data = await response.json();
        if (mode === "video") {
          const videosWithStatus = (data.data || []).map((video: CollectionVideo) => ({
            ...video,
            status: video.status || "indexed" as const,
          }));
          setVideos(videosWithStatus.reverse());
        } else {
          const imagesWithStatus = (data.data || []).map((image: CollectionImage) => ({
            ...image,
            status: image.status || "indexed" as const,
          }));
          setImages(imagesWithStatus.reverse());
        }
      } else {
        throw new Error("Failed to fetch collections");
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to load collections. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, mode]);

  // Fetch collections on mount
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);
  const handleMultipleImageUpload = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);
      const imageCount = fileArray.length;
      setIsUploading(true);

      const processingToast = toast({
        title: "Uploading images",
        description: `Starting upload of ${imageCount} image${
          imageCount !== 1 ? "s" : ""
        }...`,
        variant: "default",
      });

      try {
        const BATCH_SIZE = 5;
        const EMBED_BATCH_SIZE = 20;
        const urls: string[] = [];
        const errors: string[] = [];
        let uploadedCount = 0;

        const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

        // ============ Helper: Convert to PNG with Compression ============
        const convertToPNG = async (
          file: File
        ): Promise<{ blob: Blob; isHEIC: boolean }> => {
          const MAX_SIZE = 10 * 1024 * 1024; // 10MB limit

          // Check if it's HEIC/HEIF
          const isHEIC =
            /\.(heic|heif)$/i.test(file.name) ||
            file.type === "image/heic" ||
            file.type === "image/heif";

          if (isHEIC) {
            // For HEIC files, just return the original file
            // Cloudinary will handle the conversion
            // Only compress if over 10MB
            if (file.size > MAX_SIZE) {
              // For large HEIC files, we can't compress without converting
              // So we'll try heic2any, but with better error handling
              try {
                const heic2any = (await import("heic2any")).default;
                const convertedBlob = await heic2any({
                  blob: file,
                  toType: "image/jpeg",
                  quality: 0.7,
                });

                const blob = Array.isArray(convertedBlob)
                  ? convertedBlob[0]
                  : convertedBlob;

                // If still too large after conversion, compress more
                if (blob.size > MAX_SIZE) {
                  const compressed = await compressImage(blob, MAX_SIZE);
                  return { blob: compressed, isHEIC: false };
                }

                return { blob, isHEIC: false };
              } catch (heicError) {
                console.error("HEIC conversion failed:", heicError);
                // If file is too large and conversion failed, reject
                throw new Error(
                  "HEIC file too large and conversion failed. Please use a smaller file or convert to JPG/PNG first."
                );
              }
            }

            // File is under 10MB, let Cloudinary handle it
            return { blob: file, isHEIC: true };
          }

          // For other image formats, use canvas
          return new Promise((resolve, reject) => {
            const img = document.createElement("img");
            const url = URL.createObjectURL(file);

            img.onload = async () => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                  URL.revokeObjectURL(url);
                  reject(new Error("Failed to get canvas context"));
                  return;
                }

                let width = img.width;
                let height = img.height;

                // Calculate optimal size to stay under 10MB
                // Start with max 4000x4000, but scale down if needed
                const maxDimension = 4000;

                if (width > maxDimension || height > maxDimension) {
                  if (width > height) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                  } else {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Try PNG first with compression
                let blob = await new Promise<Blob>((res, rej) => {
                  canvas.toBlob(
                    (b) =>
                      b ? res(b) : rej(new Error("Failed to create blob")),
                    "image/png",
                    0.9
                  );
                });

                URL.revokeObjectURL(url);

                // If PNG is too large, convert to JPEG with progressive quality reduction
                if (blob.size > MAX_SIZE) {
                  blob = await compressImage(canvas, MAX_SIZE);
                }

                resolve({ blob, isHEIC: false });
              } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
              }
            };

            img.onerror = () => {
              URL.revokeObjectURL(url);
              reject(new Error("Failed to load image"));
            };

            img.src = url;
          });
        };

        // ============ Helper: Compress Image to Target Size ============
        const compressImage = async (
          source: HTMLCanvasElement | Blob,
          maxSize: number
        ): Promise<Blob> => {
          let canvas: HTMLCanvasElement;

          // If source is a blob, load it into a canvas
          if (source instanceof Blob) {
            canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = document.createElement("img");

            await new Promise((resolve, reject) => {
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                resolve(null);
              };
              img.onerror = reject;
              img.src = URL.createObjectURL(source);
            });

            URL.revokeObjectURL(img.src);
          } else {
            canvas = source;
          }

          // Try progressively lower quality JPEG until size is acceptable
          const qualities = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];

          for (const quality of qualities) {
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) =>
                  b ? resolve(b) : reject(new Error("Failed to compress")),
                "image/jpeg",
                quality
              );
            });

            if (blob.size <= maxSize) {
              return blob;
            }
          }

          // If still too large, reduce dimensions
          const scale = Math.sqrt(maxSize / (canvas.width * canvas.height * 3)); // Rough estimate
          const newWidth = Math.floor(canvas.width * scale);
          const newHeight = Math.floor(canvas.height * scale);

          const smallerCanvas = document.createElement("canvas");
          const ctx = smallerCanvas.getContext("2d");
          smallerCanvas.width = newWidth;
          smallerCanvas.height = newHeight;
          ctx?.drawImage(canvas, 0, 0, newWidth, newHeight);

          return new Promise<Blob>((resolve, reject) => {
            smallerCanvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Failed to compress"))),
              "image/jpeg",
              0.7
            );
          });
        };

        // ============ Helper: Upload Single File ============
        const uploadSingleFile = async (file: File): Promise<string> => {
          try {
            // Convert to PNG or keep HEIC
            const { blob: processedBlob, isHEIC } = await convertToPNG(file);

            // Generate unique public_id
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 9);
            const sanitizedName = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[^a-zA-Z0-9\s\-_]/g, "")
              .replace(/\s+/g, "_")
              .substring(0, 50);
            const publicId = `${timestamp}_${random}_${sanitizedName}`;

            // Get signature from backend
            const paramsToSign: Record<string, string | number> = {
              timestamp: Math.round(Date.now() / 1000),
              folder: "snoolink-studio",
              public_id: publicId,
            };

            // Only add format for HEIC files (let Cloudinary convert them)
            if (isHEIC) {
              paramsToSign.format = "jpg";
            }

            const signatureResponse = await axios.post(
              "/api/images/cloudinary-signature",
              { paramsToSign }
            );

            const { signature } = signatureResponse.data;

            // Upload directly to Cloudinary
            const formData = new FormData();
            const fileExtension = isHEIC
              ? "heic"
              : processedBlob.type === "image/jpeg"
              ? "jpg"
              : "png";

            // Ensure we have a proper Blob/File object
            const uploadBlob =
              processedBlob instanceof File
                ? processedBlob
                : new File(
                    [processedBlob],
                    `${sanitizedName}.${fileExtension}`,
                    { type: processedBlob.type }
                  );

            formData.append("file", uploadBlob);
            formData.append(
              "api_key",
              process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
            );
            formData.append("timestamp", paramsToSign.timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "snoolink-studio");
            formData.append("public_id", publicId);

            // Tell Cloudinary to convert HEIC to JPG
            if (isHEIC) {
              formData.append("format", "jpg");
            }

            const uploadResponse = await axios.post(
              CLOUDINARY_UPLOAD_URL,
              formData
            );

            if (!uploadResponse.data.secure_url) {
              throw new Error("Upload failed - no URL returned");
            }

            return uploadResponse.data.secure_url;
          } catch (error) {
            // Add file name to error for better debugging
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error";
            throw new Error(`${file.name}: ${errorMessage}`);
          }
        };

        // ============ Step 1: Upload to Cloudinary ============
        for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
          const batch = fileArray.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(fileArray.length / BATCH_SIZE);

          processingToast.update({
            title: "Uploading images",
            description: `Uploading batch ${batchNumber} of ${totalBatches} (${uploadedCount}/${imageCount} uploaded)...`,
          });

          // Upload batch in parallel
          const batchResults = await Promise.allSettled(
            batch.map((file) => uploadSingleFile(file))
          );

          // Process results
          batchResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              urls.push(result.value);
              uploadedCount++;
            } else {
              const fileName = batch[index].name;
              const errorMsg =
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason);
              errors.push(`${fileName}: ${errorMsg}`);
            }
          });

          // Update progress
          processingToast.update({
            title: "Uploading images",
            description: `${uploadedCount}/${imageCount} images uploaded...`,
          });

          // Small delay between batches
          if (i + BATCH_SIZE < fileArray.length) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // ============ Step 2: Embed Images ============
        if (urls.length > 0) {
          processingToast.update({
            title: "Processing images",
            description: `Embedding ${urls.length} images...`,
          });

          const embedPromises = [];

          for (let i = 0; i < urls.length; i += EMBED_BATCH_SIZE) {
            const urlBatch = urls.slice(i, i + EMBED_BATCH_SIZE);
            const batchNumber = Math.floor(i / EMBED_BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(urls.length / EMBED_BATCH_SIZE);

            processingToast.update({
              title: "Processing images",
              description: `Embedding batch ${batchNumber} of ${totalBatches}...`,
            });

            embedPromises.push(
              axios.post("/api/images/embed", {
                urls: urlBatch,
              })
            );

            // Small delay between embed batches
            if (i + EMBED_BATCH_SIZE < urls.length) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }

          const embedResults = await Promise.allSettled(embedPromises);

          embedResults.forEach((result, index) => {
            if (result.status === "rejected") {
              const errorMsg =
                result.reason instanceof Error
                  ? result.reason.message
                  : String(result.reason);
              errors.push(`Embed batch ${index + 1}: ${errorMsg}`);
            } else if (!result.value.data.success) {
              errors.push(
                result.value.data.error || `Embed batch ${index + 1} failed`
              );
            }
          });
        }

        // ============ Final Results ============
        processingToast.dismiss();

        if (errors.length > 0 && urls.length === 0) {
          // All uploads failed
          toast({
            title: "Upload failed",
            description: "All images failed to upload. Please try again.",
            variant: "destructive",
          });
        } else if (errors.length > 0) {
          // Some uploads/embeds failed
          toast({
            title: "Partial success",
            description: `${urls.length} images uploaded successfully. ${errors.length} failed.`,
            variant: "default",
          });
        } else {
          // All succeeded
          toast({
            title: "Images queued for processing",
            description: `Successfully uploaded ${urls.length} image${
              urls.length !== 1 ? "s" : ""
            }. Indexing might take a few minutes...`,
            variant: "success",
          });
        }

        // Log errors for debugging
        if (errors.length > 0) {
          console.error("Upload/embed errors:", errors);
        }

        return urls;
      } catch (error) {
        console.error("Error in image upload process:", error);
        processingToast.dismiss();
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process images. Please try again.",
          variant: "destructive",
        });
        return [];
      } finally {
        setIsUploading(false);
        fetchCollections();
      }
    },
    [toast, fetchCollections]
  );

  const handleMultipleVideoUpload = useCallback(
    async (videoFiles: File[]) => {
      setIsUploading(true);
      const totalVideos = videoFiles.length;

      const processingToast = toast({
        title: "Uploading videos",
        description: `Starting upload of ${totalVideos} video(s)...`,
        variant: "default",
      });

      try {
        // Get auth token from client-side Supabase
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error("Not authenticated");
        }

        const backendUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        // Step 1: Upload all videos to Cloudinary in parallel
        processingToast.update({
          title: "Uploading videos",
          description: `Uploading ${totalVideos} video(s) to Cloudinary...`,
        });

        const uploadPromises = videoFiles.map(async (videoFile, index) => {
          try {
            // Generate unique public_id
            const timestamp = Date.now();
            const random = Math.random().toString(36).slice(2, 9);
            const sanitizedName = videoFile.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[^a-zA-Z0-9\s\-_]/g, "")
              .replace(/\s+/g, "_")
              .substring(0, 50);
            const publicId = `${timestamp}_${random}_${sanitizedName}`;

            // Get signature from backend
            const paramsToSign: Record<string, string | number> = {
              timestamp: Math.round(Date.now() / 1000),
              folder: "snoolink-studio/videos",
              public_id: publicId,
            };

            const signatureResponse = await axios.post(
              "/api/videos/cloudinary-signature",
              { paramsToSign }
            );

            const { signature } = signatureResponse.data;

            // Upload directly to Cloudinary (bypasses Next.js body size limits)
            const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`;
            
            const formData = new FormData();
            formData.append("file", videoFile);
            formData.append(
              "api_key",
              process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!
            );
            formData.append("timestamp", paramsToSign.timestamp.toString());
            formData.append("signature", signature);
            formData.append("folder", "snoolink-studio/videos");
            formData.append("public_id", publicId);

            const videoUploadResponse = await axios.post(
              CLOUDINARY_UPLOAD_URL,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (!videoUploadResponse.data.secure_url) {
              throw new Error("Upload failed - no URL returned");
            }

            return {
              success: true,
              videoUrl: videoUploadResponse.data.secure_url,
              fileName: videoFile.name,
              index,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              fileName: videoFile.name,
              index,
            };
          }
        });

        const uploadResults = await Promise.all(uploadPromises);
        const successfulUploads = uploadResults.filter((r) => r.success);
        const failedUploads = uploadResults.filter((r) => !r.success);

        if (successfulUploads.length === 0) {
          throw new Error(
            `All video uploads failed: ${failedUploads.map((f) => `${f.fileName}: ${f.error}`).join("; ")}`
          );
        }

        // Step 2: Process all videos in parallel
        processingToast.update({
          title: "Queueing videos",
          description: `Queueing ${successfulUploads.length} video(s) for processing...`,
        });

        const processPromises = successfulUploads.map(async (uploadResult) => {
          try {
            const processResponse = await fetch(`${backendUrl}/api/media/process-video`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ videoUrl: uploadResult.videoUrl }),
            });

            if (!processResponse.ok) {
              const error = await processResponse.json().catch(() => ({}));
              throw new Error(error.error || "Failed to queue video");
            }

            return {
              success: true,
              fileName: uploadResult.fileName,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
              fileName: uploadResult.fileName,
            };
          }
        });

        const processResults = await Promise.all(processPromises);
        const successfulProcesses = processResults.filter((r) => r.success);
        const failedProcesses = processResults.filter((r) => !r.success);
        const processedCount = successfulProcesses.length;

        // Show results
        processingToast.dismiss();
        const totalFailed = failedUploads.length + failedProcesses.length;
        
        if (totalFailed === 0) {
          toast({
            title: "Videos queued!",
            description: `${processedCount} video(s) queued for processing`,
            variant: "success",
          });
        } else if (processedCount > 0) {
          toast({
            title: "Partial success",
            description: `${processedCount} video(s) queued. ${totalFailed} failed.`,
            variant: "default",
          });
        } else {
          const allErrors = [
            ...failedUploads.map((f) => `${f.fileName}: ${f.error}`),
            ...failedProcesses.map((f) => `${f.fileName}: ${f.error}`),
          ];
          throw new Error(`All videos failed: ${allErrors.join("; ")}`);
        }

        // Reset
        videoPreviews.forEach((url) => URL.revokeObjectURL(url));
        setVideoPreviews(new Map());
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Video upload error:", error);
        processingToast.dismiss();
        toast({
          title: "Upload failed",
          description:
            error instanceof Error ? error.message : "Failed to upload videos",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        fetchCollections();
      }
    },
    [toast, videoPreviews, fetchCollections]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        if (mode === "image") {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        handleMultipleImageUpload(imageFiles as unknown as FileList);
          }
        } else {
          const videoFiles = Array.from(files).filter((file) =>
            file.type.startsWith("video/")
          );
          if (videoFiles.length > 0) {
            // Create previews for all videos
            const newPreviews = new Map<number, string>();
            videoFiles.forEach((file, index) => {
              newPreviews.set(index, URL.createObjectURL(file));
            });
            setVideoPreviews(newPreviews);
            // Upload all videos
            handleMultipleVideoUpload(videoFiles);
          }
        }
      }
    },
    [handleMultipleImageUpload, handleMultipleVideoUpload, mode]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  // Filter assets based on status
  const filteredImages = filterStatus === "all" 
    ? images 
    : images.filter(img => img.status === filterStatus);
  
  const filteredVideos = filterStatus === "all" 
    ? videos 
    : videos.filter(vid => vid.status === filterStatus);

  // Get collection metadata
  const collectionCount = mode === "image" ? images.length : videos.length;
  const oldestImage = images.length > 0 ? images[images.length - 1] : null;
  const oldestVideo = videos.length > 0 ? videos[videos.length - 1] : null;
  
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

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const files = e.target.files;
      if (files && files.length > 0) {
        if (mode === "image") {
        handleMultipleImageUpload(files as unknown as FileList);
        } else {
          // Handle video uploads (multiple)
          const videoFiles = Array.from(files).filter((file) =>
            file.type.startsWith("video/")
          );
          if (videoFiles.length === 0) {
            toast({
              title: "Invalid files",
              description: "Please select video files",
              variant: "destructive",
            });
            return;
          }
          // Create previews for all videos
          const newPreviews = new Map<number, string>();
          videoFiles.forEach((file, index) => {
            newPreviews.set(index, URL.createObjectURL(file));
          });
          setVideoPreviews(newPreviews);
          // Upload all videos
          handleMultipleVideoUpload(videoFiles);
        }
      }
    },
    [handleMultipleImageUpload, handleMultipleVideoUpload, mode, toast]
  );

  return (
    <div className="flex-1 flex flex-col h-full py-4 sm:py-6 lg:py-8 bg-white">
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <span>Collections</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">
          {mode === "image" ? "Images" : "Videos"}
        </span>
      </div>

      {/* Mode Toggle - Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-0">
          <button
            onClick={() => {
              setMode("image");
              videoPreviews.forEach((url) => URL.revokeObjectURL(url));
              setVideoPreviews(new Map());
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              fetchCollections();
            }}
            disabled={isUploading}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
              mode === "image"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Images
          </button>
          <button
            onClick={() => {
              setMode("video");
              videoPreviews.forEach((url) => URL.revokeObjectURL(url));
              setVideoPreviews(new Map());
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
              fetchCollections();
            }}
            disabled={isUploading}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
              mode === "video"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Videos
          </button>
        </div>
      </div>

      {/* Header with Collection Metadata */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {mode === "image" ? "Image Collection" : "Video Collection"}
            </h1>
            {hasAssets && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium">{collectionCount}</span>
                  <span>{mode === "image" ? "images" : "videos"}</span>
                </span>
                {((mode === "image" && oldestImage) || (mode === "video" && oldestVideo)) && (
                  <>
                    <span>•</span>
                    <span>Created {formatDate(mode === "image" ? oldestImage?.uploadedAt : oldestVideo?.createdAt)}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1.5 text-purple-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-indexed for semantic search</span>
                </span>
              </div>
            )}
            {!hasAssets && (
              <p className="text-gray-600 text-sm sm:text-base">
                Upload {mode === "image" ? "images" : "videos"} to build your semantic search collection
              </p>
            )}
      </div>

          {/* Toolbar Actions */}
          {hasAssets && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="border-gray-300"
              >
                {viewMode === "grid" ? (
                  <><ListIcon className="h-4 w-4 mr-2" />List</>
                ) : (
                  <><Grid3x3 className="h-4 w-4 mr-2" />Grid</>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowUploadZone(!showUploadZone);
                  if (!showUploadZone) {
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload {mode === "image" ? "Images" : "Video"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upload Section - Collapsed when assets exist */}
      {(!hasAssets || showUploadZone) && (
        <div className="mb-4 sm:mb-6">
          <div
            className={`p-4 sm:p-6 border-2 border-dashed rounded-lg transition-all ${
              isDragActive
                ? "border-purple-500 bg-purple-50 border-solid scale-[1.02]"
                : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/30"
            }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center justify-center text-center">
              <div className={`mb-2 sm:mb-3 transition-transform ${isDragActive ? "scale-110" : ""}`}>
                <CloudUpload className={`h-8 w-8 sm:h-10 sm:w-10 text-purple-600 ${isDragActive ? "animate-bounce" : ""}`} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                {mode === "image"
                  ? "Upload Multiple Images"
                  : "Upload Video"}
          </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-1 px-2">
                {mode === "image"
                  ? "Drag and drop images here, or click to select from your computer."
                  : "Drag and drop video files (MP4, MOV, etc.) here, or click to select from your computer."}
              </p>
              <p className="text-xs text-gray-500 mb-3 sm:mb-4">
                {mode === "image"
                  ? "Supports JPG, PNG, HEIC · Max 10MB per image · Auto-indexed for semantic search"
                  : "Supports MP4, MOV, AVI · Auto-indexed for semantic search"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {mode === "image" ? "Uploading..." : "Processing..."}
              </>
            ) : (
              <>
                      <Folder className="h-4 w-4 mr-2" />
                      Select {mode === "image" ? "Images" : "Video"}
              </>
            )}
          </Button>
                {mode === "image" && (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-gray-300"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Upload via URL
                  </Button>
                )}
              </div>
              {uploadProgress && (
                <div className="mt-4 w-full max-w-md">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Processing {uploadProgress.current} of {uploadProgress.total}</span>
                    <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
          <input
            ref={fileInputRef}
            type="file"
                accept={mode === "image" ? "image/*" : "video/mp4,video/quicktime,video/x-msvideo,video/*"}
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

          {/* Video Previews */}
          {mode === "video" && videoPreviews.size > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                {videoPreviews.size} video{videoPreviews.size !== 1 ? "s" : ""} selected:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {Array.from(videoPreviews.entries()).map(([index, previewUrl]) => (
                  <div key={index} className="space-y-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        src={previewUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Sort Bar */}
      {hasAssets && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
              <Filter className="h-4 w-4" />
              Filter:
            </span>
            {(["all", "indexed", "processing", "failed"] as FilterStatus[]).map((status) => (
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
              <span>SORT BY: {sortBy === "relevance" ? "Relevance" : sortBy === "date" ? "Date Added" : sortBy === "name" ? "Name" : "Score"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="date">Date Added</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status Indicator */}
      {hasAssets && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-600 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span>
            {mode === "image" 
              ? `Embedding ${images.filter(img => img.status === "processing").length || 0} images in background`
              : `Processing ${videos.filter(vid => vid.status === "processing").length || 0} videos in background`}
          </span>
        </div>
      )}

      {/* Images/Videos Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : mode === "video" ? (
        filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <Video className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-900 font-medium text-lg mb-2">
              {filterStatus !== "all" ? `No ${filterStatus} videos` : "No videos yet"}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {filterStatus !== "all" 
                ? "Try adjusting your filters"
                : "Upload videos to build your semantic search collection"}
            </p>
            {filterStatus !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterStatus("all")}
                className="mt-2"
              >
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            )}
        </div>
      ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            : "space-y-3"
          }>
            {filteredVideos.map((video) => {
              const urlParts = video.videoUrl.split('/');
              const filename = urlParts[urlParts.length - 1].split('?')[0] || 'video.mp4';
              const status = video.status || "indexed";
              // Extract a shorter description preview
              const descriptionPreview = video.description 
                ? video.description.length > 80 
                  ? video.description.substring(0, 80) + "..." 
                  : video.description
                : null;
              
              return (
                <Card
                  key={video.id}
                  className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all group ${
                    viewMode === "list" ? "flex flex-row" : "flex flex-col"
                  }`}
                >
                  <div className={`relative bg-gray-100 ${
                    viewMode === "list" 
                      ? "w-24 h-24 flex-shrink-0" 
                      : "aspect-video"
                  }`}>
                    <video
                      src={video.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                    {/* Status Badge - Smaller */}
                    <div className="absolute top-1.5 right-1.5">
                      {status === "indexed" && (
                        <div className="bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span className="hidden sm:inline">Indexed</span>
                        </div>
                      )}
                      {status === "processing" && (
                        <div className="bg-yellow-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 animate-spin" />
                          <span className="hidden sm:inline">Processing</span>
                        </div>
                      )}
                      {status === "failed" && (
                        <div className="bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <AlertCircle className="h-2.5 w-2.5" />
                          <span className="hidden sm:inline">Failed</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 flex flex-col ${viewMode === "list" ? "p-3" : "p-3"} min-w-0`}>
                    <p className="text-xs font-semibold text-gray-900 mb-1 truncate">
                      {filename}
                    </p>
                    {descriptionPreview && (
                      <p className={`text-[11px] text-gray-600 leading-snug ${
                        viewMode === "list" ? "line-clamp-1" : "line-clamp-2"
                      }`}>
                        {descriptionPreview}
                      </p>
                    )}
          </div>
                </Card>
              );
            })}
          </div>
        )
      ) : filteredImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
          <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-900 font-medium text-lg mb-2">
            {filterStatus !== "all" ? `No ${filterStatus} images` : "No images yet"}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            {filterStatus !== "all" 
              ? "Try adjusting your filters"
              : "Upload images to build your semantic search collection"}
          </p>
          {filterStatus !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterStatus("all")}
              className="mt-2"
            >
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === "grid" 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          : "space-y-3"
        }>
          {filteredImages.map((image) => {
            // Extract filename from URL
            const urlParts = image.imageUrl.split('/');
            const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image.jpg';
            const status = image.status || "indexed";
            // Extract a shorter description preview
            const descriptionPreview = image.description 
              ? image.description.length > 60 
                ? image.description.substring(0, 60) + "..." 
                : image.description
              : null;
            
            return (
              <Card
                key={image.id}
                className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 hover:shadow-lg transition-all group ${
                  viewMode === "list" ? "flex flex-row" : "flex flex-col"
                }`}
              >
                <div className={`relative bg-gray-100 ${
                  viewMode === "list" 
                    ? "w-20 h-20 flex-shrink-0" 
                    : "aspect-square"
                }`}>
                  <Image
                    src={image.imageUrl}
                    alt={image.description || "Collection image"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Status Badge - Always visible, smaller */}
                  <div className="absolute top-1.5 right-1.5">
                    {status === "indexed" && (
                      <div className="bg-green-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      </div>
                    )}
                    {status === "processing" && (
                      <div className="bg-yellow-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <Clock className="h-2.5 w-2.5 animate-spin" />
                      </div>
                    )}
                    {status === "failed" && (
                      <div className="bg-red-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <AlertCircle className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  {/* Subtle hover overlay */}
                  {viewMode === "grid" && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <div className={`flex-1 flex flex-col ${viewMode === "list" ? "p-2.5" : "p-2.5"} min-w-0`}>
                  <p className="text-[11px] font-semibold text-gray-900 mb-1 truncate leading-tight">
                    {filename}
                  </p>
                  {descriptionPreview && (
                    <p className={`text-[10px] text-gray-600 leading-snug ${
                      viewMode === "list" ? "line-clamp-1" : "line-clamp-2"
                    }`}>
                      {descriptionPreview}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
          </div>
      )}
    </div>
  );
}
