import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "kp_session";
export const DEVICE_COOKIE = "kp_device";

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

export function base64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
}

export async function requireUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/?reason=signin");

  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name_admin AS displayName, u.role, s.id AS sessionId, s.device_id AS deviceId
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?1
      AND s.revoked_at IS NULL
      AND s.expires_at > ?2
      AND u.status = 'active'
    LIMIT 1
  `).bind(tokenHash, now).first<{ id: string; email: string; displayName: string; role: string; sessionId: string; deviceId: string }>();

  if (!row) redirect("/?reason=session");
  return row;
}

