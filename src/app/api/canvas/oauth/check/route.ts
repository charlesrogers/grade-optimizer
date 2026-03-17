import { NextRequest, NextResponse } from "next/server";
import { getOAuthInstance } from "@/lib/canvas-oauth";

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.searchParams.get("baseUrl");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "baseUrl is required" },
      { status: 400 }
    );
  }

  try {
    const instance = getOAuthInstance(baseUrl);
    return NextResponse.json({ oauthAvailable: instance !== null });
  } catch {
    return NextResponse.json({ oauthAvailable: false });
  }
}
