import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertAdmin, fingerprint } from "@/lib/data";
import { startDriveUpload } from "@/lib/apps-script-upload";
import { parseTeacherProfile } from "@/lib/teacher-profile";

const FOLDER_ID="14pCU1zJSFPlk_k91Qi8Qy6tCdtMxQjir";
const ALLOWED=new Set(["image/jpeg","image/png","image/webp"]);
export const dynamic="force-dynamic";

export async function POST(request:Request){
  try{
    const actor=await requireUser();assertAdmin(actor);
    const form=await request.formData();const file=form.get("photo");
    const name=String(form.get("name")||"").trim().slice(0,100),program=String(form.get("program")||"").trim().slice(0,160),institution=String(form.get("institution")||"").trim().slice(0,160),year=String(form.get("year")||"").trim().slice(0,20);
    if(!(file instanceof File)||!name||!program||!institution||!year)throw new Error("กรุณากรอกชื่อ ผลสอบ/คณะ สถาบัน ปี และเลือกรูปให้ครบ");
    if(!ALLOWED.has(file.type))throw new Error("รองรับเฉพาะรูป JPG, PNG และ WebP");
    if(file.size>8*1024*1024)throw new Error("รูปต้องมีขนาดไม่เกิน 8 MB");
    const current=await env.DB.prepare("SELECT value_json valueJson FROM site_settings WHERE setting_key='teacher_profile' LIMIT 1").first<{valueJson:string}>();
    const profile=parseTeacherProfile(current?.valueJson);const studentResults=Array.isArray(profile.studentResults)?profile.studentResults:[];profile.studentResults=studentResults;if(studentResults.length>=200)throw new Error("Photo Grid ครบ 200 คนแล้ว");
    const uploadId=crypto.randomUUID();const extension=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const baseName=`${year}-${name}-${program}-${institution}`.replace(/[^\p{L}\p{N}._-]+/gu,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,170);const fileName=`${baseName}-${uploadId.slice(0,6)}.${extension}`;
    const uploadUrl=await startDriveUpload({folderType:"student",fileName,mimeType:file.type,size:file.size});
    const uploaded=await fetch(uploadUrl,{method:"PUT",headers:{"content-type":file.type,"content-range":`bytes 0-${file.size-1}/${file.size}`},body:file});
    if(!uploaded.ok)throw new Error("อัปโหลดรูปเข้า Google Drive ไม่สำเร็จ");
    const {id}=await uploaded.json() as {id:string};studentResults.push({name,program,institution,year,photoUrl:`https://drive.google.com/file/d/${id}/view`});
    const now=new Date().toISOString();await env.DB.batch([env.DB.prepare(`INSERT INTO site_settings(setting_key,value_json,updated_by,updated_at) VALUES('teacher_profile',?1,?2,?3) ON CONFLICT(setting_key) DO UPDATE SET value_json=excluded.value_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(JSON.stringify(profile),actor.id,now),env.DB.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,ip_hash,created_at) VALUES(?1,?2,'student_result.upload','teacher_profile',?3,NULL,?4,?5,?6)`).bind(crypto.randomUUID(),actor.id,id,JSON.stringify({name,program,institution,year}),await fingerprint(),now)]);
    return NextResponse.json({ok:true,id});
  }catch(error){const message=error instanceof Error?error.message:"อัปโหลดไม่สำเร็จ";return NextResponse.json({error:message},{status:message==="FORBIDDEN"?403:400})}
}
