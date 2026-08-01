import { NextResponse } from "next/server";
import { driveFileId, getDriveAccessToken } from "@/lib/google-drive";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId: rawFileId } = await params;
    const fileId = driveFileId(rawFileId);
    const token = await getDriveAccessToken();
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) return NextResponse.json({ error: "ไม่พบรูปหรือยังไม่ได้แชร์ให้ระบบ" }, { status: 404 });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return NextResponse.json({ error: "ไฟล์นี้ไม่ใช่รูปภาพ" }, { status: 415 });
    return new NextResponse(response.body, { headers: { "content-type": contentType, "cache-control": "public, max-age=3600, s-maxage=86400", "x-content-type-options": "nosniff" } });
  } catch { return NextResponse.json({ error: "ไม่สามารถเปิดรูปได้" }, { status: 400 }); }
}
