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
    const query = searchParams.get("query");
    const collections = searchParams.get("collections");
    const topK = searchParams.get("topK") || "10";

    if (!query) {
      return NextResponse.json(
        { success: false, error: "Search query is required" },
        { status: 400 }
      );
    }

    if (!collections) {
      return NextResponse.json(
        { success: false, error: "Collections parameter is required" },
        { status: 400 }
      );
    }

    // Build query string
    const params = new URLSearchParams();
    params.append("query", query);
    params.append("collections", collections);
    params.append("topK", topK);
    const expandQuery = searchParams.get("expandQuery");
    if (expandQuery !== null) params.set("expandQuery", expandQuery);
    const minScore = searchParams.get("minScore");
    if (minScore !== null) params.set("minScore", minScore);

    const response = await fetch(
      `${backendUrl}/api/media/search-videos-collections?${params.toString()}`,
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
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

