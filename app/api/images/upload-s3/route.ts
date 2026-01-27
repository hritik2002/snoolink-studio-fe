import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import heicConvert from "heic-convert";
import sharp from "sharp";
import { getAuthToken } from "@/lib/supabase/api-helper";
import crypto from "crypto";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  if (!bucketName) {
    return NextResponse.json(
      { error: "S3 bucket not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("images");

    const validFiles = files.filter(
      (file): file is File => file instanceof File
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: "No valid images provided" },
        { status: 400 }
      );
    }

    // Validate files
    for (const file of validFiles) {
      if (!ALLOWED_MIME_TYPES.includes(file.type) && 
          !/\.(heic|heif)$/i.test(file.name)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || file.name}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 50MB` },
          { status: 400 }
        );
      }
    }

    const uploads = await Promise.all(
      validFiles.map(async (file) => {
        try {
          let buffer = Buffer.from(await file.arrayBuffer());
          const fileName = file.name;
          const fileType = file.type.toLowerCase();

          /* ---------------- HEIC/HEIF → PNG ---------------- */
          if (
            /\.(heic|heif)$/i.test(fileName) ||
            fileType === "image/heic" ||
            fileType === "image/heif"
          ) {
            buffer = Buffer.from(
              await heicConvert({
                buffer,
                format: "PNG",
                quality: 1, // max quality for HEIC conversion
              })
            );
          }

          /* ---------------- Convert to PNG with Sharp ---------------- */
          const processedImage = await sharp(buffer)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(4000, 4000, {
              fit: "inside",
              withoutEnlargement: true,
            })
            .png({
              compressionLevel: 9, // 0-9, max compression
              adaptiveFiltering: true,
              quality: 100, // ensure high quality
            })
            .toBuffer();

          // Get image metadata
          const metadata = await sharp(processedImage).metadata();

          /* ---------------- Generate unique key (random only — avoids "file already exists") ---------------- */
          const timestamp = Date.now();
          const randomId = crypto.randomBytes(12).toString("hex");
          const key = `snoolink-studio/images/${timestamp}_${randomId}.png`;

          /* ---------------- Upload to S3 ---------------- */
          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: processedImage,
            ContentType: "image/png",
          });

          await s3Client.send(command);

          const baseUrl =
            process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") ||
            `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_S3_REGION || "us-east-1"}.amazonaws.com`;
          const url = `${baseUrl}/${key}`;

          return {
            url,
            publicId: key,
            width: metadata.width || 0,
            height: metadata.height || 0,
          };
        } catch (fileError) {
          console.error(`Error processing ${file.name}:`, fileError);
          throw new Error(
            `Failed to process ${file.name}: ${
              fileError instanceof Error ? fileError.message : "Unknown error"
            }`
          );
        }
      })
    );

    return NextResponse.json({ success: true, images: uploads }, { status: 200 });
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
