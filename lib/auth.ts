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
  const deviceId = jar.get(DEVICE_COOKIE)?.value;
  if (!token || !deviceId) redirect("/?reason=signin");
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const idleCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const row = await env.DB.prepare(`
    SELECT u.id, u.email, u.display_name_admin AS displayName, u.role, s.id AS sessionId, s.device_id AS deviceId
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    JOIN devices d ON d.id = s.device_id AND d.user_id = s.user_id
    WHERE s.token_hash = ?1
      AND s.device_id = ?2
      AND d.status = 'approved'
      AND s.revoked_at IS NULL
      AND s.expires_at > ?3
      AND s.last_seen_at > ?4
      AND u.status = 'active'
    LIMIT 1
  `).bind(tokenHash, deviceId, now, idleCutoff).first<{ id: string; email: string; displayName: string; role: string; sessionId: string; deviceId: string }>();

  if (!row) redirect("/?reason=session");
  await env.DB.batch([
    env.DB.prepare("UPDATE sessions SET last_seen_at=?1 WHERE id=?2").bind(now, row.sessionId),
    env.DB.prepare("UPDATE devices SET last_seen_at=?1 WHERE id=?2").bind(now, row.deviceId),
  ]);
  return row;
}

