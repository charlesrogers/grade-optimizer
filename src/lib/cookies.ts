import { cookies } from "next/headers";
import { CanvasConfig, LMSConfig } from "./types";
import { getOAuthInstance, refreshAccessToken } from "./canvas-oauth";

const COOKIE_NAME = "grade_optimizer_config";
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

/**
 * Store LMS config in an httpOnly cookie.
 * In MVP, we store JSON directly. In production, encrypt with a secret.
 */
export async function setLMSConfig(config: LMSConfig): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, JSON.stringify(config), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

/**
 * Retrieve LMS config from cookie.
 */
export async function getLMSConfig(): Promise<LMSConfig | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    return JSON.parse(cookie.value) as LMSConfig;
  } catch {
    return null;
  }
}

/**
 * Get Canvas config specifically (convenience helper).
 */
export async function getCanvasConfig(): Promise<CanvasConfig | null> {
  const config = await getLMSConfig();
  if (!config || config.type !== "canvas") return null;
  return config.config;
}

/**
 * Get Canvas config, auto-refreshing the token if it's near expiry.
 * Falls through to regular getCanvasConfig() for manual token logins.
 */
export async function getCanvasConfigWithRefresh(): Promise<CanvasConfig | null> {
  const lmsConfig = await getLMSConfig();
  if (!lmsConfig || lmsConfig.type !== "canvas") return null;

  const config = lmsConfig.config;

  // No refresh token = manual token login, return as-is
  if (!config.refreshToken || !config.tokenExpiresAt) return config;

  // Check if token needs refresh
  if (Date.now() + REFRESH_BUFFER_MS < config.tokenExpiresAt) return config;

  // Token is expired or about to expire — refresh it
  const instance = getOAuthInstance(config.baseUrl);
  if (!instance) return config; // can't refresh without credentials

  try {
    const refreshed = await refreshAccessToken(
      config.baseUrl,
      config.refreshToken,
      instance
    );

    const updatedConfig: CanvasConfig = {
      ...config,
      accessToken: refreshed.access_token,
      tokenExpiresAt: Date.now() + refreshed.expires_in * 1000,
    };

    await setLMSConfig({ type: "canvas", config: updatedConfig });
    return updatedConfig;
  } catch (err) {
    console.error("Token refresh failed:", err);
    return config; // return stale token, let the API call fail naturally
  }
}

/**
 * Clear stored config (logout).
 */
export async function clearLMSConfig(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
