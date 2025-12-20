import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const topK = searchParams.get("topK");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    const response = await fetch(
      `${backendUrl}/api/media/search-videos?query=${encodeURIComponent(query)}${topK ? `&topK=${topK}` : ""}`,
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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}



