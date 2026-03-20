export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getOAuthInstance,
  exchangeCodeForToken,
  getCallbackUrl,
} from "@/lib/canvas-oauth";
import { validateToken, fetchObservees } from "@/lib/canvas-client";
import { setLMSConfig } from "@/lib/cookies";
import { CanvasConfig } from "@/lib/types";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    // User denied authorization
    if (error) {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_failed`
      );
    }

    // Decode state and verify nonce
    let statePayload: { nonce: string; baseUrl: string };
    try {
      const decoded = Buffer.from(state, "base64url").toString();
      statePayload = JSON.parse(decoded);
    } catch {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_failed`
      );
    }

    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("oauth_state")?.value;

    if (!storedNonce || storedNonce !== statePayload.nonce) {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_failed`
      );
    }

    // Clear the state cookie
    cookieStore.delete("oauth_state");

    // Look up OAuth credentials for this Canvas instance
    const instance = getOAuthInstance(statePayload.baseUrl);
    if (!instance) {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_failed`
      );
    }

    // Exchange code for tokens
    const redirectUri = getCallbackUrl();
    const tokenData = await exchangeCodeForToken(
      statePayload.baseUrl,
      code,
      redirectUri,
      instance
    );

    const config: CanvasConfig = {
      baseUrl: statePayload.baseUrl,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiresAt: Date.now() + tokenData.expires_in * 1000,
    };

    // Validate the token works
    const validation = await validateToken(config);
    if (!validation.valid) {
      return NextResponse.redirect(
        `${appUrl}/connect?error=oauth_failed`
      );
    }

    // Check for observer (parent) account
    const observees = await fetchObservees(config);

    // Store config in cookie
    await setLMSConfig({ type: "canvas", config });

    // Redirect to appropriate page
    if (observees.length > 0) {
      // Store observees in a short-lived cookie for the family page to read
      cookieStore.set("oauth_observees", JSON.stringify(observees), {
        httpOnly: false, // needs to be readable by client JS
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60, // 1 minute
        path: "/",
      });
      return NextResponse.redirect(`${appUrl}/family`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/connect?error=oauth_failed`
    );
  }
}
