"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/lib/hooks/use-toast";

interface CollectionImage {
  id: string;
  imageUrl: string;
  description?: string;
  uploadedAt?: string;
}

export default function ImageCollections() {
  const [images, setImages] = useState<CollectionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/images/collections");
      if (response.ok) {
        const data = await response.json();
        console.log("Collections data:", data);
        setImages(data.data || []);
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

      // Show processing toast
      const processingToast = toast({
        title: "Uploading images",
        description: `Starting upload of ${imageCount} image${
          imageCount !== 1 ? "s" : ""
        }...`,
        variant: "default",
      });

      try {
        // Create FormData with all images
        const formData = new FormData();
        fileArray.forEach((file) => {
          formData.append("images", file);
        });

        // Upload directly to embed API
        const response = await fetch("/api/images/embed", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || "Failed to upload images");
        }

        const data = await response.json();

        processingToast.dismiss();

        if (data.success) {
          const successful = data.data?.successful || [];
          const failed = data.data?.failed || [];

          if (successful.length > 0) {
            toast({
              title: "Success!",
              description: `${successful.length} image${
                successful.length !== 1 ? "s" : ""
              } uploaded and processed successfully.${
                failed.length > 0 ? ` ${failed.length} failed.` : ""
              }`,
              variant: "success",
            });
          }

          if (failed.length > 0) {
            toast({
              title: "Some uploads failed",
              description: `${failed.length} image${
                failed.length !== 1 ? "s" : ""
              } failed to upload.`,
              variant: "destructive",
            });
          }
        }

        // Refresh collections
        await fetchCollections();
      } catch (error) {
        console.error("Error uploading images:", error);
        processingToast.dismiss();
        toast({
          title: "Upload failed",
          description:
            error instanceof Error
              ? error.message
              : "Failed to upload images. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [toast, fetchCollections]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleMultipleImageUpload(files);
      }
    },
    [handleMultipleImageUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        handleMultipleImageUpload(imageFiles as unknown as FileList);
      }
    },
    [handleMultipleImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white mb-2">Collections</h1>
        <p className="text-white/60 text-sm">
          View and manage your ingested images
        </p>
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
            Upload Multiple Images
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Drag and drop images here, or click to select
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Select Images
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
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
