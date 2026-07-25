import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sha256 } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    await env.DB.prepare("UPDATE sessions SET revoked_at = ?1 WHERE token_hash = ?2 AND revoked_at IS NULL")
      .bind(new Date().toISOString(), await sha256(token)).run();
  }
  const response = NextResponse.redirect(new URL("/", process.env.SITE_URL ?? request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
