import { NextRequest, NextResponse } from "next/server";
import { validateSkywardCredentials } from "@/lib/skyward-client";
import { setLMSConfig } from "@/lib/cookies";
import { SkywardConfig } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loginUrl, username, password } = body as {
      loginUrl?: string;
      username?: string;
      password?: string;
    };

    if (!loginUrl || !username || !password) {
      return NextResponse.json(
        { error: "Skyward URL, username, and password are required" },
        { status: 400 }
      );
    }

    const config: SkywardConfig = {
      loginUrl: loginUrl.replace(/\/+$/, ""),
      username,
      password,
    };

    const result = await validateSkywardCredentials(config);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    await setLMSConfig({ type: "skyward", config });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (err) {
    console.error("Skyward connect error:", err);
    return NextResponse.json(
      { error: "Failed to connect to Skyward" },
      { status: 500 }
    );
  }
}
