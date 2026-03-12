import { cookies } from "next/headers";
import { CanvasConfig, LMSConfig } from "./types";

const COOKIE_NAME = "grade_optimizer_config";

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
 * Clear stored config (logout).
 */
export async function clearLMSConfig(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
