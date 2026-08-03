import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertAdmin, fingerprint } from "@/lib/data";
import { driveFileId } from "@/lib/google-drive";
import { requireSameOrigin } from "@/lib/security";

type Question={prompt?:string;type?:string;labelStyle?:string;options?:string[];correctAnswers?:string[];points?:number;pdfPage?:number;explanation?:string;manualGrading?:boolean};
const clean=(value:unknown,max=500)=>String(value??"").trim().slice(0,max);
async function admin(){const actor=await requireUser();assertAdmin(actor);return actor}
function fail(error:unknown){return NextResponse.json({error:error instanceof Error?error.message:"ดำเนินการไม่สำเร็จ"},{status:400})}

export async function GET(request:NextRequest){
  try{
    await admin();const quizId=clean(request.nextUrl.searchParams.get("quizId"),80);
    if(!quizId)return NextResponse.json({error:"กรุณาระบุชุดข้อสอบ"},{status:400});
    const quiz=await env.DB.prepare(`SELECT q.*,l.title lessonTitle,c.title courseTitle FROM quizzes q JOIN lessons l ON l.id=q.lesson_id JOIN courses c ON c.id=l.course_id WHERE q.id=?1`).bind(quizId).first();
    if(!quiz)return NextResponse.json({error:"ไม่พบชุดข้อสอบ"},{status:404});
    const questions=await env.DB.prepare("SELECT * FROM quiz_questions WHERE quiz_id=?1 ORDER BY position").bind(quizId).all();
    const attempts=await env.DB.prepare(`SELECT a.id,a.user_id userId,u.display_name_admin displayName,u.email,a.attempt_number attemptNumber,a.status,a.started_at startedAt,a.submitted_at submittedAt,a.score,a.max_score maxScore,a.percent,a.suspicious_count suspiciousCount,a.teacher_remark teacherRemark,a.deleted_at deletedAt FROM quiz_attempts a JOIN users u ON u.id=a.user_id WHERE a.quiz_id=?1 ORDER BY a.started_at DESC`).bind(quizId).all();
    const stats=await env.DB.prepare(`SELECT COUNT(*) submitted,ROUND(AVG(percent),2) average,MAX(percent) maximum,MIN(percent) minimum,ROUND(AVG((julianday(submitted_at)-julianday(started_at))*1440),2) averageMinutes FROM quiz_attempts WHERE quiz_id=?1 AND deleted_at IS NULL AND status IN ('submitted','graded','pending_review')`).bind(quizId).first();
    return NextResponse.json({quiz,questions:questions.results,attempts:attempts.results,stats});
  }catch(error){return fail(error)}
}

export async function POST(request:NextRequest){
  requireSameOrigin(request);
  try{
    const actor=await admin(),body=await request.json() as Record<string,unknown>,action=clean(body.action,40),now=new Date().toISOString();
    if(action==="quiz.create"){
      const courseId=clean(body.courseId,80),title=clean(body.title,180),fileId=driveFileId(clean(body.fileId,600)),position=Math.max(1,Number(body.position)||1);
      const questions=(Array.isArray(body.questions)?body.questions:[]) as Question[];
      if(!courseId||!title||!questions.length)throw new Error("กรุณากรอกข้อมูลและเพิ่มคำถามอย่างน้อย 1 ข้อ");
      const lessonId=crypto.randomUUID(),quizId=crypto.randomUUID(),status=body.status==="published"?"published":"draft";
      const statements=[
        env.DB.prepare(`INSERT INTO lessons(id,course_id,title,type,provider_asset_id,position,status,created_at,updated_at) VALUES(?1,?2,?3,'quiz',?4,?5,?6,?7,?7)`).bind(lessonId,courseId,title,`drive:${fileId}`,position,status,now),
        env.DB.prepare(`INSERT INTO quizzes(id,lesson_id,pdf_asset_id,duration_minutes,max_attempts,pass_percent,show_result_mode,shuffle_questions,shuffle_options,instructions,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?11)`).bind(quizId,lessonId,fileId,Math.max(1,Number(body.durationMinutes)||60),Math.max(1,Number(body.maxAttempts)||1),Math.max(0,Math.min(100,Number(body.passPercent)||50)),["hidden","score","review"].includes(String(body.showResultMode))?String(body.showResultMode):"score",body.shuffleQuestions?1:0,body.shuffleOptions?1:0,clean(body.instructions,3000),now)
      ];
      questions.forEach((question,index)=>{
        const type=["choice","short","number"].includes(String(question.type))?String(question.type):"choice";
        const options=(question.options||[]).map(x=>clean(x,500)).filter(Boolean).slice(0,6);
        if(type==="choice"&&(options.length<4||options.length>6))throw new Error(`ข้อ ${index+1} ต้องมี 4–6 ตัวเลือก`);
        statements.push(env.DB.prepare(`INSERT INTO quiz_questions(id,quiz_id,position,pdf_page,prompt,question_type,label_style,options_json,correct_answers_json,points,explanation,manual_grading,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?13)`).bind(crypto.randomUUID(),quizId,index+1,Math.max(1,Number(question.pdfPage)||1),clean(question.prompt,2000),type,["latin","thai","number"].includes(String(question.labelStyle))?String(question.labelStyle):"latin",JSON.stringify(options),JSON.stringify((question.correctAnswers||[]).map(x=>clean(x,500))),Math.max(1,Number(question.points)||1),clean(question.explanation,3000),question.manualGrading?1:0,now));
      });
      await env.DB.batch(statements);body.id=quizId;body.lessonId=lessonId;
    }else if(action==="attempt.delete"){
      const attemptId=clean(body.id,80),reason=clean(body.reason,500);if(!reason)throw new Error("กรุณาระบุเหตุผลที่ลบประวัติ");
      await env.DB.prepare("UPDATE quiz_attempts SET deleted_at=?1,deleted_by=?2,delete_reason=?3,updated_at=?1 WHERE id=?4").bind(now,actor.id,reason,attemptId).run();
    }else if(action==="attempt.remark"){
      await env.DB.prepare("UPDATE quiz_attempts SET teacher_remark=?1,updated_at=?2 WHERE id=?3").bind(clean(body.remark,3000),now,clean(body.id,80)).run();
    }else if(action==="attempt.restore"){
      await env.DB.prepare("UPDATE quiz_attempts SET deleted_at=NULL,deleted_by=NULL,delete_reason=NULL,updated_at=?1 WHERE id=?2").bind(now,clean(body.id,80)).run();
    }else throw new Error("ไม่รู้จักคำสั่ง");
    await env.DB.prepare(`INSERT INTO audit_logs(id,actor_user_id,action,entity_type,entity_id,before_json,after_json,ip_hash,created_at) VALUES(?1,?2,?3,'quiz',?4,NULL,?5,?6,?7)`).bind(crypto.randomUUID(),actor.id,action,clean(body.id||body.lessonId,80),JSON.stringify(body),await fingerprint(),now).run();
    return NextResponse.json({ok:true,id:body.id,lessonId:body.lessonId});
  }catch(error){return fail(error)}
}
