import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const metadataStr = formData.get("metadata") as string;

    if (!chunk || !metadataStr) {
      return NextResponse.json(
        { error: "Missing chunk or metadata" },
        { status: 400 }
      );
    }

    const metadata = JSON.parse(metadataStr);

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    // Forward chunk to backend
    const chunkFormData = new FormData();
    chunkFormData.append("chunk", chunk);
    chunkFormData.append("metadata", metadataStr);

    const response = await fetch(`${backendUrl}/api/upload-chunk`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: chunkFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend request failed: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in upload-chunk route:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

