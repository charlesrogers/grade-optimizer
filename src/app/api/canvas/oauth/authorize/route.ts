import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizationUrl, getCallbackUrl, getOAuthInstance } from "@/lib/canvas-oauth";

export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.searchParams.get("baseUrl");

  if (!baseUrl) {
    return NextResponse.json(
      { error: "baseUrl is required" },
      { status: 400 }
    );
  }

  const instance = getOAuthInstance(baseUrl);
  if (!instance) {
    return NextResponse.json(
      { error: "OAuth not configured for this Canvas instance" },
      { status: 400 }
    );
  }

  // Generate state with nonce for CSRF protection
  const nonce = crypto.randomUUID();
  const statePayload = JSON.stringify({
    nonce,
    baseUrl: baseUrl.replace(/\/+$/, ""),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  // Store nonce in short-lived httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set("oauth_state", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const redirectUri = getCallbackUrl();
  const authUrl = buildAuthorizationUrl(baseUrl, redirectUri, state);

  return NextResponse.redirect(authUrl);
}
