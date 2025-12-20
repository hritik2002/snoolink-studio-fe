"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon, Video } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";

type Mode = "image" | "video";

interface CollectionImage {
  id: string;
  imageUrl: string;
  description?: string;
  uploadedAt?: string;
}

export default function ImageCollections() {
  const [mode, setMode] = useState<Mode>("image");
  const [images, setImages] = useState<CollectionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviews, setVideoPreviews] = useState<Map<number, string>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/images/collections");
      if (response.ok) {
        const data = await response.json();
        setImages(data.data.reverse() || []);
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
  }, [toast]);

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
                let maxDimension = 4000;

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
            const paramsToSign: Record<string, any> = {
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
            const videoFormData = new FormData();
            videoFormData.append("file", videoFile);

            const videoUploadResponse = await fetch("/api/videos/upload-cloudinary", {
              method: "POST",
              body: videoFormData,
            });

            if (!videoUploadResponse.ok) {
              const error = await videoUploadResponse.json().catch(() => ({}));
              throw new Error(error.error || "Failed to upload video");
            }

            const videoUploadData = await videoUploadResponse.json();
            return {
              success: true,
              videoUrl: videoUploadData.url,
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
      }
    },
    [toast, videoPreviews]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
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
  }, []);

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
    <div className="flex-1 flex flex-col h-full py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Collections</h1>
        <p className="text-white/60 text-sm">
          View and manage your ingested {mode === "image" ? "images" : "videos"}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="flex gap-2 max-w-md">
          <Button
            variant={mode === "image" ? "default" : "outline"}
            onClick={() => {
              setMode("image");
              videoPreviews.forEach((url) => URL.revokeObjectURL(url));
              setVideoPreviews(new Map());
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={isUploading}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Images
          </Button>
          <Button
            variant={mode === "video" ? "default" : "outline"}
            onClick={() => {
              setMode("video");
              videoPreviews.forEach((url) => URL.revokeObjectURL(url));
              setVideoPreviews(new Map());
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            disabled={isUploading}
            className="flex-1"
          >
            <Video className="h-4 w-4 mr-2" />
            Videos
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <div
        className="mb-8 p-8 border-2 border-dashed border-white/20 rounded-xl bg-[#1a1a1a]/50 hover:border-white/30 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="h-12 w-12 text-white/40 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {mode === "image"
              ? "Upload Multiple Images"
              : "Upload Video"}
          </h3>
          <p className="text-white/60 text-sm mb-4">
            {mode === "image"
              ? "Drag and drop images here, or click to select"
              : "Drag and drop video files (MP4, MOV, etc.) here, or click to select"}
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "image" ? "Uploading..." : "Processing..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select {mode === "image" ? "Images" : "Video"}
              </>
            )}
          </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={mode === "image" ? "image/*" : "video/mp4,video/quicktime,video/x-msvideo,video/*"}
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        
        {/* Video Previews */}
        {mode === "video" && videoPreviews.size > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-white/60">
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

      {/* Images Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-white/40 text-lg mb-2">No images yet</p>
          <p className="text-white/30 text-sm">Upload images to get started</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-white/60 text-sm">
              {images.length} image{images.length !== 1 ? "s" : ""} in
              collection
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className="bg-[#1a1a1a] border-white/10 overflow-hidden hover:border-white/20 transition-colors group"
              >
                <div className="relative aspect-square">
                  <Image
                    src={image.imageUrl}
                    alt={image.description || "Collection image"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {image.description && (
                  <div className="p-3">
                    <p className="text-sm text-white/60 line-clamp-2">
                      {image.description}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
