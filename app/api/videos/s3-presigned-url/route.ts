import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileName, contentType = "video/mp4" } = await request.json();
    
    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    const sanitizedName = fileName
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9\s\-_]/g, "") // remove special chars
      .replace(/\s+/g, "_") // replace spaces with underscore
      .substring(0, 50);
    
    const extension = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : ".mp4";
    const key = `snoolink-studio/videos/${timestamp}_${random}_${sanitizedName}${extension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ 
      presignedUrl,
      key,
      url: `https://${bucketName}.s3.${process.env.NEXT_PUBLIC_S3_REGION || "us-east-1"}.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
