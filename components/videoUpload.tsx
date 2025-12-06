"use client";

import axios from "axios";
import { useState } from "react";
import { useToast } from "@/lib/hooks/use-toast";

export default function VideoUploader() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid video file",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("language", "en");

    // Show processing toast
    const processingToast = toast({
      title: "Uploading video",
      description: "Processing your video file...",
      variant: "default",
    });

    try {
      setUploading(true);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResponse(res.data);
      
      // Dismiss processing toast and show success
      processingToast.dismiss();
      toast({
        title: "Upload successful!",
        description: "Your video has been uploaded and processed successfully.",
        variant: "success",
      });
    } catch (err) {
      console.error("Upload error:", err);
      processingToast.dismiss();
      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : "Failed to upload video. Please try again.";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Upload Video</h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {videoPreview && (
        <video
          src={videoPreview}
          controls
          className="w-full rounded-lg shadow mb-4"
        />
      )}

      <button
        onClick={handleUpload}
        disabled={!videoFile || uploading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Video"}
      </button>

      {response && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <h3 className="font-semibold">Server Response:</h3>
          <pre className="text-sm text-gray-700 overflow-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
