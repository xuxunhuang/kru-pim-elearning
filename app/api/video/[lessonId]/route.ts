import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdminRole,usage } from "@/lib/data";
import { driveFileId, getDriveAccessToken } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
const MAX_CHUNK_BYTES = 2 * 1024 * 1024;

function protectedHeaders() {
  return {
    "accept-ranges": "bytes",
    "cache-control": "private, no-store, no-cache, must-revalidate, max-age=0",
    "content-disposition": "inline",
    "cross-origin-resource-policy": "same-origin",
    "pragma": "no-cache",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  const fetchDest = request.headers.get("sec-fetch-dest");
  if (!referer || new URL(referer).origin !== request.nextUrl.origin || (fetchSite && fetchSite !== "same-origin") || (fetchDest && fetchDest !== "video")) {
    return NextResponse.json({ error: "อนุญาตให้เล่นผ่านตัวเล่นใน Kru Pim เท่านั้น" }, { status: 403, headers: protectedHeaders() });
  }

  const user = await requireUser();
  const { lessonId } = await params;
  const now = new Date().toISOString();
  const lesson = isAdminRole(user.role)
    ? await env.DB.prepare(`SELECT provider_asset_id asset FROM lessons WHERE id=?1 AND type='video' LIMIT 1`).bind(lessonId).first<{ asset: string }>()
    : await env.DB.prepare(`SELECT l.provider_asset_id asset FROM lessons l JOIN courses c ON c.id=l.course_id JOIN enrollments e ON e.course_id=c.id WHERE l.id=?1 AND e.user_id=?2 AND l.type='video' AND l.status='published' AND c.status='published' AND e.status='active' AND COALESCE((SELECT starts_at FROM access_overrides o WHERE o.enrollment_id=e.id AND o.lesson_id=l.id),e.starts_at)<=?3 AND COALESCE((SELECT ends_at FROM access_overrides o WHERE o.enrollment_id=e.id AND o.lesson_id=l.id),e.ends_at)>=?3 LIMIT 1`).bind(lessonId, user.id, now).first<{ asset: string }>();
  if (!lesson || !lesson.asset.startsWith("drive:")) return NextResponse.json({ error: "ไม่พบวิดีโอหรือไม่มีสิทธิ์" }, { status: 404, headers: protectedHeaders() });

  const requestedRange = request.headers.get("range") || "bytes=0-";
  const match = requestedRange.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) return NextResponse.json({ error: "รูปแบบช่วงวิดีโอไม่ถูกต้อง" }, { status: 416, headers: protectedHeaders() });
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : start + MAX_CHUNK_BYTES - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) || start < 0 || requestedEnd < start) {
    return NextResponse.json({ error: "ช่วงวิดีโอไม่ถูกต้อง" }, { status: 416, headers: protectedHeaders() });
  }
  const end = Math.min(requestedEnd, start + MAX_CHUNK_BYTES - 1);

  try {
    const token = await getDriveAccessToken();
    const upstream = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId(lesson.asset)}?alt=media`, {
      headers: { authorization: `Bearer ${token}`, range: `bytes=${start}-${end}` },
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: upstream.status === 403 ? "ไฟล์ Drive ยังไม่ได้แชร์ให้ระบบ" : "เปิดวิดีโอไม่สำเร็จ" }, { status: upstream.status, headers: protectedHeaders() });

    if (start === 0) await usage(user, "video.stream.start", lessonId, { chunkBytes: MAX_CHUNK_BYTES });
    const out = new Headers({ ...protectedHeaders(), "content-type": upstream.headers.get("content-type") || "video/mp4" });
    for (const key of ["content-length", "content-range"]) if (upstream.headers.get(key)) out.set(key, upstream.headers.get(key)!);
    return new Response(upstream.body, { status: upstream.status === 200 ? 206 : upstream.status, headers: out });
  } catch (error) {
    const message = error instanceof Error && error.message === "DRIVE_NOT_CONFIGURED" ? "ระบบ Google Drive ยังไม่ได้ตั้งค่า" : "เปิดวิดีโอไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 503, headers: protectedHeaders() });
  }
}
