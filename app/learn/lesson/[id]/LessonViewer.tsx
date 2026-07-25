"use client";
import { useState } from "react";
import Link from "next/link";

type Props={lesson:Record<string,string>;policy:Record<string,string>;accepted:boolean;watermark:string};

export function LessonViewer({lesson,policy,accepted:initial,watermark}:Props){
  const[accepted,setAccepted]=useState(initial),[check,setCheck]=useState(false),[busy,setBusy]=useState(false),[completed,setCompleted]=useState(false);
  async function post(url:string,body:unknown){setBusy(true);const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});setBusy(false);return r.ok}
  async function accept(){if(await post("/api/agreement",{lessonId:lesson.id,courseId:lesson.courseId,policyId:policy.id}))setAccepted(true)}
  async function finish(event="complete"){if(await post("/api/progress",{lessonId:lesson.id,event}))setCompleted(true)}
  async function openPdf(){await finish("document.open");window.open(lesson.asset,"_blank","noopener,noreferrer")}
  const isDrive=lesson.asset.startsWith("drive:");
  return <main className="viewer-shell"><header className="lesson-header"><Link href={`/learn/course/${lesson.courseId}`}>← กลับไปยังคอร์ส</Link><b>{lesson.courseTitle}</b></header>{!accepted?<section className="agreement-card"><span className="eyebrow">ต้องยอมรับก่อนเรียน</span><h1>{policy.title}</h1><p>{policy.body}</p><label className="check-row"><input type="checkbox" checked={check} onChange={e=>setCheck(e.target.checked)}/><span>ฉันอ่านและยอมรับข้อตกลงฉบับที่ {policy.version} และเข้าใจว่าระบบบันทึกการยอมรับครั้งนี้</span></label><button className="primary-button" disabled={!check||busy} onClick={accept}>{busy?"กำลังบันทึก…":"ยอมรับและเริ่มเรียน"}</button></section>:<section className="viewer-content"><div className="viewer-title"><span className="eyebrow">{lesson.type==="video"?"วิดีโอ":"เอกสาร PDF"}</span><h1>{lesson.title}</h1></div>{lesson.type==="video"?<><div className="video-frame">{isDrive?<video controls controlsList="nodownload" playsInline preload="metadata" src={`/api/video/${lesson.id}`} onPlay={()=>{void post("/api/progress",{lessonId:lesson.id,event:"start"})}}/>:<iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId(lesson.asset.replace(/^youtube:/,""))}?rel=0&modestbranding=1`} title={lesson.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen/>}<Watermark text={watermark}/></div><div className="viewer-actions"><p>เมื่อดูถึงช่วงท้าย ให้กดบันทึกว่าเรียนจบ</p><button className="primary-button" disabled={busy||completed} onClick={()=>finish()}>{completed?"บันทึกว่าเรียนจบแล้ว ✓":busy?"กำลังบันทึก…":"บันทึกว่าเรียนจบ"}</button></div></>:<div className="pdf-panel"><div><b>เอกสารประกอบบทเรียน</b><p>การเปิดเอกสารจะถูกบันทึกพร้อมข้อมูลผู้เรียนและถือว่าได้เปิดเรียนบทนี้แล้ว</p><button className="primary-button" disabled={busy} onClick={openPdf}>{busy?"กำลังตรวจสิทธิ์…":"เปิดเอกสาร PDF"}</button></div><Watermark text={watermark}/></div>}</section>}</main>
}
function youtubeId(v:string){try{const u=new URL(v);return u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop()||v}catch{return v}}
function Watermark({text}:{text:string}){return <div className="media-watermark" aria-hidden>{Array.from({length:12},(_,i)=><span key={i}>{text} · {new Date().toLocaleDateString("th-TH")}</span>)}</div>}
