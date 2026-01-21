import { NextRequest, NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = request.nextUrl;
    const q = searchParams.toString();
    const res = await fetch(`${backendUrl}/api/admin/analytics/users${q ? `?${q}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
