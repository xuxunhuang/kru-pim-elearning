import { NextResponse } from "next/server";
import { base64Url, randomToken, sha256 } from "@/lib/auth";

const FLOW_COOKIE = "kp_google_flow";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google Login ยังไม่ได้ตั้งค่า" }, { status: 503 });
  }

  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const challenge = await sha256(verifier);
  const flow = base64Url(new TextEncoder().encode(JSON.stringify({ state, nonce, verifier })));

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(url);
  response.cookies.set(FLOW_COOKIE, flow, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
