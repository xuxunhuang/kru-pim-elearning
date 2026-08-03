import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertAdmin, fingerprint } from "@/lib/data";
import { getDriveAccessToken, driveFileId } from "@/lib/google-drive";
import { parseTeacherProfile } from "@/lib/teacher-profile";
import { requireSameOrigin } from "@/lib/security";

const FOLDER_ID = "14pCU1zJSFPlk_k91Qi8Qy6tCdtMxQjir";
export const dynamic = "force-dynamic";

async function admin() {
  const actor = await requireUser();
  assertAdmin(actor);
  return actor;
}

export async function GET() {
  try {
    await admin();
    const token = await getDriveAccessToken();
    const query = `'${FOLDER_ID}' in parents and trashed=false and mimeType contains 'image/'`;
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", query);
    url.searchParams.set("fields", "files(id,name,mimeType,thumbnailLink,modifiedTime)");
    url.searchParams.set("orderBy", "modifiedTime desc");
    url.searchParams.set("pageSize", "200");
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("ไม่สามารถอ่านรูปจาก Google Drive ได้");
    const data = await response.json() as { files?: unknown[] };
    return NextResponse.json({ files: data.files ?? [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "โหลดรูปไม่สำเร็จ" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  requireSameOrigin(request);
  try {
    const actor = await admin();
    const body = await request.json() as Record<string, unknown>;
    const fileId = driveFileId(String(body.fileId || ""));
    const name = String(body.name || "").trim().slice(0, 100);
    const program = String(body.program || "").trim().slice(0, 160);
    const institution = String(body.institution || "").trim().slice(0, 160);
    const year = String(body.year || "").trim().slice(0, 20);
    if (!name || !program || !institution || !year) throw new Error("กรุณาเลือกรูปและกรอกข้อมูลให้ครบ");

    const token = await getDriveAccessToken();
    const verify = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,parents,mimeType,trashed`, { headers: { authorization: `Bearer ${token}` } });
    if (!verify.ok) throw new Error("ไม่พบรูปที่เลือกใน Google Drive");
    const file = await verify.json() as { parents?: string[]; mimeType?: string; trashed?: boolean };
    if (file.trashed || !file.parents?.includes(FOLDER_ID) || !file.mimeType?.startsWith("image/")) throw new Error("รูปที่เลือกไม่ได้อยู่ในโฟลเดอร์ผลงานนักเรียน");

    const current = await env.DB.prepare("SELECT value_json valueJson FROM site_settings WHERE setting_key='teacher_profile' LIMIT 1").first<{ valueJson: string }>();
    const profile = parseTeacherProfile(current?.valueJson);
    if (profile.studentResults.length >= 200) throw new Error("Photo Grid ครบ 200 คนแล้ว");
    profile.studentResults.push({ name, program, institution, year, photoUrl: `https://drive.google.com/file/d/${fileId}/view` });
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO site_settings(setting_key,value_json,updated_by,updated_at) VALUES('teacher_profile',?1,?2,?3) ON CONFLICT(setting_key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(JSON.stringify(profile), actor.id, now),
      env.DB.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,ip_hash,created_at) VALUES(?1,?2,'student_result.drive_select','teacher_profile',?3,NULL,?4,?5,?6)`).bind(crypto.randomUUID(), actor.id, fileId, JSON.stringify({ name, program, institution, year }), await fingerprint(), now),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "เพิ่มผลงานไม่สำเร็จ" }, { status: 400 });
  }
}
