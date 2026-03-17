export interface CanvasOAuthInstance {
  clientId: string;
  clientSecret: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  user?: { id: number; name: string };
}

const SCOPES = [
  "url:GET|/api/v1/users/self",
  "url:GET|/api/v1/users/self/observees",
  "url:GET|/api/v1/courses",
  "url:GET|/api/v1/courses/:course_id/assignment_groups",
  "url:GET|/api/v1/users/:user_id/missing_submissions",
].join(" ");

/**
 * Look up OAuth credentials for a Canvas instance by its base URL.
 * Reads from CANVAS_OAUTH_INSTANCES env var (JSON map of domain → credentials).
 */
export function getOAuthInstance(
  canvasBaseUrl: string
): CanvasOAuthInstance | null {
  const raw = process.env.CANVAS_OAUTH_INSTANCES;
  if (!raw) return null;

  try {
    const instances: Record<string, CanvasOAuthInstance> = JSON.parse(raw);
    const hostname = new URL(canvasBaseUrl).hostname;
    return instances[hostname] ?? null;
  } catch {
    return null;
  }
}

/**
 * Build the Canvas OAuth2 authorization URL.
 */
export function buildAuthorizationUrl(
  canvasBaseUrl: string,
  redirectUri: string,
  state: string
): string {
  const baseUrl = canvasBaseUrl.replace(/\/+$/, "");
  const params = new URLSearchParams({
    client_id: getOAuthInstance(canvasBaseUrl)!.clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: SCOPES,
  });
  return `${baseUrl}/login/oauth2/auth?${params.toString()}`;
}

/**
 * Exchange an authorization code for access + refresh tokens.
 */
export async function exchangeCodeForToken(
  canvasBaseUrl: string,
  code: string,
  redirectUri: string,
  instance: CanvasOAuthInstance
): Promise<TokenResponse> {
  const baseUrl = canvasBaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: instance.clientId,
      client_secret: instance.clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  canvasBaseUrl: string,
  refreshToken: string,
  instance: CanvasOAuthInstance
): Promise<{ access_token: string; expires_in: number }> {
  const baseUrl = canvasBaseUrl.replace(/\/+$/, "");
  const res = await fetch(`${baseUrl}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: instance.clientId,
      client_secret: instance.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Get the callback URL for OAuth redirects.
 */
export function getCallbackUrl(): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/api/canvas/oauth/callback`;
}
