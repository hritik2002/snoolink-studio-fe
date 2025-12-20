import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAuthToken } from "@/lib/supabase/api-helper";

export const runtime = "nodejs";

// Configure max body size for this route (100MB)
export const maxDuration = 300; // 5 minutes for large uploads

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: Request) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "File must be a video" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const fileName = file.name;

    // Generate unique public_id
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 9);
    const sanitizedName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
    const publicId = `${timestamp}_${random}_${sanitizedName}`;

    // Stream file directly to Cloudinary to avoid memory issues
    // Convert File to ReadableStream and then to Buffer in chunks
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    return new Promise((resolve) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "snoolink-studio/videos",
          resource_type: "video",
          public_id: publicId,
          invalidate: true,
          chunk_size: 6000000, // 6MB chunks for better performance
        },
        (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            resolve(
              NextResponse.json(
                {
                  error: `Failed to upload video: ${error.message}`,
                },
                { status: 500 }
              )
            );
          } else {
            resolve(
              NextResponse.json(
                {
                  success: true,
                  url: result!.secure_url,
                  publicId: result!.public_id,
                },
                { status: 200 }
              )
            );
          }
        }
      );

      upload.end(buffer);
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload video",
      },
      { status: 500 }
    );
  }
}



