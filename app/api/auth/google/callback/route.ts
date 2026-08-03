import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { base64Url, DEVICE_COOKIE, randomToken, SESSION_COOKIE, sha256 } from "@/lib/auth";import { rateLimit,requestIdentity } from "@/lib/security";

const FLOW_COOKIE = "kp_google_flow";
const SESSION_DAYS = 90;

function decodeFlow(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const json = new TextDecoder().decode(Uint8Array.from(atob(normalized), (char) => char.charCodeAt(0)));
  return JSON.parse(json) as { state: string; nonce: string; verifier: string };
}

function appUrl(path: string) {
  return new URL(path, process.env.SITE_URL ?? "http://localhost:3000");
}

export async function GET(request: NextRequest) {
  try {
    await rateLimit({key:await requestIdentity(request,"oauth-callback"),limit:30,windowSeconds:300});
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const flowValue = request.cookies.get(FLOW_COOKIE)?.value;
    if (!code || !state || !flowValue) return NextResponse.redirect(appUrl("/?reason=oauth"));

    const flow = decodeFlow(flowValue);
    if (flow.state !== state) return NextResponse.redirect(appUrl("/?reason=state"));

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) throw new Error("Missing Google OAuth configuration");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: flow.verifier,
      }),
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokens.id_token) throw new Error("Missing Google ID token");

    const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
    if (!infoResponse.ok) throw new Error("Google token verification failed");
    const profile = await infoResponse.json() as {
      sub: string; email: string; email_verified: string; name?: string;
      aud: string; iss: string; exp: string; nonce?: string;
    };
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      profile.aud !== clientId ||
      !["accounts.google.com", "https://accounts.google.com"].includes(profile.iss) ||
      Number(profile.exp) <= nowSeconds ||
      profile.email_verified !== "true" ||
      (profile.nonce && profile.nonce !== flow.nonce)
    ) throw new Error("Google identity validation failed");

    const email = profile.email.trim().toLowerCase();
    const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
    let user = await env.DB.prepare("SELECT id, role, status, max_devices AS maxDevices FROM users WHERE google_sub = ?1 OR email = ?2 LIMIT 1")
      .bind(profile.sub, email).first<{ id: string; role: string; status: string; maxDevices: number }>();

    if (!user) {
      if (!ownerEmail || email !== ownerEmail) return NextResponse.redirect(appUrl("/?reason=not-allowed"));
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();
      await env.DB.prepare(`
        INSERT INTO users (id, google_sub, email, display_name_admin, role, status, max_devices, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, 'owner', 'active', 2, ?5, ?5)
      `).bind(userId, profile.sub, email, profile.name || "ครูพิม", now).run();
      user = { id: userId, role: "owner", status: "active", maxDevices: 2 };
    }
    if (user.status !== "active") return NextResponse.redirect(appUrl("/?reason=disabled"));

    await env.DB.prepare("UPDATE users SET google_sub = ?1, updated_at = ?2 WHERE id = ?3")
      .bind(profile.sub, new Date().toISOString(), user.id).run();

    const existingDevice = request.cookies.get(DEVICE_COOKIE)?.value;
    let deviceId = existingDevice || crypto.randomUUID();
    if (existingDevice) {
      const owner = await env.DB.prepare("SELECT user_id AS userId FROM devices WHERE id = ?1 LIMIT 1")
        .bind(existingDevice).first<{ userId: string }>();
      if (owner && owner.userId !== user.id) deviceId = crypto.randomUUID();
    }
    const userAgent = request.headers.get("user-agent") || "unknown";
    const userAgentHash = await sha256(userAgent);
    const now = new Date().toISOString();
    const device = await env.DB.prepare("SELECT id, status FROM devices WHERE id = ?1 AND user_id = ?2 LIMIT 1")
      .bind(deviceId, user.id).first<{ id: string; status: string }>();

    if (!device) {
      const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM devices WHERE user_id = ?1 AND status = 'approved'")
        .bind(user.id).first<{ total: number }>();
      const isAdmin = ["owner", "admin", "teacher", "assistant"].includes(user.role);
      if (!isAdmin && (count?.total ?? 0) >= user.maxDevices) return NextResponse.redirect(appUrl("/?reason=device-limit"));
      await env.DB.prepare(`
        INSERT INTO devices (id, user_id, public_key, label, user_agent_hash, status, created_at, last_seen_at, revoked_at)
        VALUES (?1, ?2, NULL, 'อุปกรณ์ที่ลงทะเบียน', ?3, 'approved', ?4, ?4, NULL)
      `).bind(deviceId, user.id, userAgentHash, now).run();
    } else if (device.status !== "approved") {
      return NextResponse.redirect(appUrl("/?reason=device"));
    } else {
      await env.DB.prepare("UPDATE devices SET user_agent_hash=?1,last_seen_at=?2 WHERE id=?3 AND user_id=?4").bind(userAgentHash,now,deviceId,user.id).run();
    }

    await env.DB.prepare("UPDATE sessions SET revoked_at = ?1 WHERE user_id = ?2 AND device_id = ?3 AND revoked_at IS NULL")
      .bind(now, user.id, deviceId).run();
    const rawToken = randomToken(48);
    const sessionId = crypto.randomUUID();
    const tokenHash = await sha256(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
    await env.DB.prepare(`
      INSERT INTO sessions (id, user_id, device_id, token_hash, generation, expires_at, last_seen_at, revoked_at, created_at)
      VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, NULL, ?6)
    `).bind(sessionId, user.id, deviceId, tokenHash, expiresAt, now).run();

    const response = NextResponse.redirect(appUrl("/learn"));
    response.cookies.delete(FLOW_COOKIE);
    response.cookies.set(SESSION_COOKIE, rawToken, { httpOnly: true, secure: true, sameSite: "lax", maxAge: SESSION_DAYS * 86400, path: "/" });
    response.cookies.set(DEVICE_COOKIE, deviceId, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 365 * 86400, path: "/" });
    return response;
  } catch {
    return NextResponse.redirect(appUrl("/?reason=oauth-failed"));
  }
}
