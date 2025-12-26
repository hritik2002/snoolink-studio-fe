import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get("collection");
    const type = searchParams.get("type");
    const limit = searchParams.get("limit") || "20";
    const offset = searchParams.get("offset") || "0";

    // Build query string
    const params = new URLSearchParams();
    if (collection) params.append("collection", collection);
    if (type) params.append("type", type);
    params.append("limit", limit);
    params.append("offset", offset);

    const response = await fetch(
      `${backendUrl}/api/media/resources?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend request failed: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in resources route:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

