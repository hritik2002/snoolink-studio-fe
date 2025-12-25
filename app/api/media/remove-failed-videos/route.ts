import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobIds } = await request.json();

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "jobIds array is required" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

    try {
      const response = await fetch(
        `${backendUrl}/api/media/remove-failed-videos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobIds }),
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
            : "Unknown error in remove-failed-videos route",
      });
    }
  } catch (error) {
    console.error("Error in remove-failed-videos route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

