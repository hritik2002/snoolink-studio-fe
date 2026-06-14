"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";

type Mode = "image" | "video";

export default function UnifiedUpload() {
  const [mode, setMode] = useState<Mode>("image");
  const [files, setFiles] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<Map<number, string>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setFiles([]);
    setVideoPreviews(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (mode === "image") {
      const imageFiles = selectedFiles.filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length !== selectedFiles.length) {
        toast({
          title: "Invalid files",
          description: "Please select only image files",
          variant: "destructive",
        });
      }
      setFiles(imageFiles);
    } else {
      const videoFiles = selectedFiles.filter((file) =>
        file.type.startsWith("video/")
      );
      if (videoFiles.length !== selectedFiles.length) {
        toast({
          title: "Invalid files",
          description: "Please select only video files",
          variant: "destructive",
        });
      }
      if (videoFiles.length > 0) {
        setFiles(videoFiles);
        // Create previews for all videos
        const newPreviews = new Map<number, string>();
        videoFiles.forEach((file, index) => {
          newPreviews.set(index, URL.createObjectURL(file));
        });
        setVideoPreviews(newPreviews);
      }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress("");

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

      if (mode === "image") {
        // Upload images to S3 first
        setProgress("Uploading images to S3...");
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("images", file);
        });

        const uploadResponse = await fetch("/api/images/upload-s3", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json().catch(() => ({}));
          throw new Error(error.error || "Failed to upload images");
        }

        const uploadData = await uploadResponse.json();
        const imageUrls = uploadData.images.map((img: any) => img.url);

        // Queue images for processing
        setProgress("Queueing images for processing...");
        const processResponse = await fetch(`${backendUrl}/api/media/upload-images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ urls: imageUrls }),
        });

        if (!processResponse.ok) {
          const error = await processResponse.json().catch(() => ({}));
          throw new Error(error.error || "Failed to queue images");
        }

        toast({
          title: "Images uploaded!",
          description: `${files.length} image(s) queued for processing`,
          variant: "success",
        });
      } else {
        // For videos, upload all to S3 in parallel, then process all in parallel
        const totalVideos = files.length;
        setProgress(`Uploading ${totalVideos} video(s) to S3...`);

        // Step 1: Upload all videos directly to S3 in parallel (bypasses Next.js body size limits)
        const uploadPromises = files.map(async (videoFile, index) => {
          try {
            // Get presigned URL from backend
            const presignedResponse = await axios.post(
              "/api/videos/s3-presigned-url",
              { 
                fileName: videoFile.name,
                contentType: videoFile.type || "video/mp4"
              }
            );

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

            return {
              success: true,
              videoUrl: url,
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

        setProgress(
          `Queueing ${successfulUploads.length} video(s) for processing...`
        );

        // Step 2: Process all videos in parallel
        const processPromises = successfulUploads.map(async (uploadResult) => {
          try {
            const processResponse = await fetch(
              `${backendUrl}/api/media/process-video`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ videoUrl: uploadResult.videoUrl }),
              }
            );

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

        // Show results
        if (failedUploads.length === 0 && failedProcesses.length === 0) {
          toast({
            title: "Videos queued!",
            description: `${successfulProcesses.length} video(s) queued for processing`,
            variant: "success",
          });
        } else {
          const totalFailed = failedUploads.length + failedProcesses.length;
          const totalSuccess = successfulProcesses.length;
          toast({
            title: "Partial success",
            description: `${totalSuccess} video(s) queued. ${totalFailed} failed.`,
            variant: "default",
          });
        }
      }

      // Reset after successful upload
      setFiles([]);
      // Clean up video preview URLs
      videoPreviews.forEach((url) => URL.revokeObjectURL(url));
      setVideoPreviews(new Map());
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mode Toggle */}
      <Card className="p-4 bg-[#1a1a1a] border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-white">Upload Mode</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === "image" ? "default" : "outline"}
            onClick={() => handleModeChange("image")}
            className="flex-1"
            disabled={uploading}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image Search
          </Button>
          <Button
            variant={mode === "video" ? "default" : "outline"}
            onClick={() => handleModeChange("video")}
            className="flex-1"
            disabled={uploading}
          >
            <Video className="h-4 w-4 mr-2" />
            Video Search
          </Button>
        </div>
      </Card>

      {/* Upload Area */}
      <Card className="p-6 bg-[#1a1a1a] border-white/10">
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg p-8 hover:border-white/40 transition-colors">
            <Upload className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {mode === "image"
                ? "Upload Images"
                : "Upload Video"}
            </h3>
            <p className="text-white/60 text-sm mb-4 text-center">
              {mode === "image"
                ? "Select one or more image files to upload and index"
                : "Select one or more video files (MP4, MOV, etc.) to upload and index"}
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
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
          {mode === "video" && files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-white/60">
                {files.length} video{files.length !== 1 ? "s" : ""} selected:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-xs text-white/60 truncate">{file.name}</p>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                      <video
                        src={videoPreviews.get(index)}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-white/40">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-white/60">
                {files.length} file{files.length !== 1 ? "s" : ""} selected:
              </p>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="text-sm text-white/80 bg-white/5 p-2 rounded"
                  >
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="text-sm text-white/60 bg-white/5 p-3 rounded">
              {progress}
            </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Index
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

