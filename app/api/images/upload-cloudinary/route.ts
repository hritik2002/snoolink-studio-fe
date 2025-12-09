import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { getAuthToken } from "@/lib/supabase/api-helper";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});
export async function POST(request: Request) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const files = formData.getAll("images");

    // Filter to ensure we only have File objects
    const validFiles = files.filter(
      (file): file is File => file instanceof File
    );

    if (!validFiles || validFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided" },
        { status: 400 }
      );
    }

    const uploads = await Promise.all(
      validFiles.map(async (file) => {
        let buffer: Buffer = Buffer.from(await file.arrayBuffer()) as Buffer;
        const fileName = file.name;

        // Check if the file is HEIC/HEIF and convert to PNG
        const isHeic = /\.(heic|heif)$/i.test(file.name);

        if (isHeic) {
          throw new Error("HEIC images are not supported");
        }

        const maxSize = 1 * 1024 * 1024; // 1MB
        if (buffer.length > maxSize) {
          try {
            buffer = (await sharp(buffer)
              .resize(4000, 4000, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .jpeg({ quality: 70 })
              .toBuffer()) as Buffer;
          } catch (compressionError) {
            throw new Error(`Failed to compress image: ${fileName}`);
          }
        }

        // Generate unique public_id to avoid collisions
        // Use timestamp + random string + sanitized filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        // Remove extension and sanitize filename (remove special chars, keep alphanumeric, spaces, hyphens, underscores)
        const sanitizedName = fileName
          .replace(/\.[^/.]+$/, "") // Remove extension
          .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .substring(0, 50); // Limit length
        const uniquePublicId = `${timestamp}_${random}_${sanitizedName}`;

        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: "snoolink-studio",
              resource_type: "image",
              public_id: uniquePublicId,
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          upload.end(buffer);
        });
      })
    );

    const urls = uploads.map(
      (upload: Record<string, string>) => upload.secure_url
    );

    return NextResponse.json({ success: true, urls }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload images",
      },
      { status: 500 }
    );
  }
}
