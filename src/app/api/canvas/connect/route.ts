export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { validateToken, fetchObservees } from "@/lib/canvas-client";
import { setLMSConfig } from "@/lib/cookies";
import { CanvasConfig } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl, accessToken } = body as {
      baseUrl?: string;
      accessToken?: string;
    };

    if (!baseUrl || !accessToken) {
      return NextResponse.json(
        { error: "Canvas URL and access token are required" },
        { status: 400 }
      );
    }

    // Normalize the base URL
    const cleanUrl = baseUrl
      .replace(/\/+$/, "")
      .replace(/\/api\/v1\/?$/, "");

    const config: CanvasConfig = {
      baseUrl: cleanUrl,
      accessToken: accessToken.trim(),
    };

    // Validate the token
    const result = await validateToken(config);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid token" },
        { status: 401 }
      );
    }

    // Check if this is an observer (parent) account
    const observees = await fetchObservees(config);

    // Store config in cookie
    await setLMSConfig({ type: "canvas", config });

    return NextResponse.json({
      success: true,
      user: result.user,
      isObserver: observees.length > 0,
      observees,
    });
  } catch (err) {
    console.error("Canvas connect error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Canvas" },
      { status: 500 }
    );
  }
}
