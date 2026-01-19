import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/supabase/api-helper";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function GET() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: true, isAdmin: false });
    }
    const res = await fetch(`${backendUrl}/api/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: true, isAdmin: false });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ success: true, isAdmin: false });
  }
}
