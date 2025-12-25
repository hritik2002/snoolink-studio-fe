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

    try {
      const response = await fetch(
        `${backendUrl}/api/media/user-processing-failed-videos`,
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
      return NextResponse.json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error in processing-failed-videos route",
      });
    }
  } catch (error) {
    console.error("Error in processing-failed-videos route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

