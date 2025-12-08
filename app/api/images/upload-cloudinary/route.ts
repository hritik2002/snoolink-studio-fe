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

    console.log(`Processing ${validFiles.length} files`);

    const uploads = await Promise.all(
      validFiles.map(async (file) => {
        console.log(`Processing file: ${file.name}, size: ${file.size} bytes`);

        let buffer = Buffer.from(await file.arrayBuffer());
        let fileName = file.name;

        // Check if the file is HEIC/HEIF and convert to PNG
        const isHeic = /\.(heic|heif)$/i.test(file.name);

        if (isHeic) {
          try {
            const inputBuffer = Buffer.from(buffer);

            const convertedBuffer = await heicConvert({
              buffer: inputBuffer.buffer,
              format: "PNG",
              quality: 1,
            });

            buffer = Buffer.from(convertedBuffer);
            fileName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
          } catch (conversionError) {
            console.error("HEIC conversion failed:", conversionError);
            throw new Error(`Failed to convert HEIC image: ${file.name}`);
          }
        }

        const maxSize = 1 * 1024 * 1024; // 1MB
        if (buffer.length > maxSize) {
          try {
            buffer = await sharp(buffer)
              .resize(4000, 4000, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .jpeg({ quality: 70 })
              .toBuffer();

          } catch (compressionError) {
            console.error("Image compression failed:", compressionError);
            throw new Error(`Failed to compress image: ${fileName}`);
          }
        }

        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: "snoolink-studio",
              resource_type: "image",
              public_id: fileName.split(".")[0],
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
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload images",
      },
      { status: 500 }
    );
  }
}
