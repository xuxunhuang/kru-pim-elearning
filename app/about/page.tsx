import { env } from "cloudflare:workers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseTeacherProfile } from "@/lib/teacher-profile";
import { StudentResultsGrid } from "./StudentResultsGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "รู้จักครูพิม", description: "ประวัติ แนวทางการสอน และข้อมูลของครูพิม" };

type SectionProps={title:string;eyebrow:string;items:string[]};
function ListSection({title,eyebrow,items}:SectionProps){if(!items.length)return null;return <section className="about-section"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><div className="about-list">{items.map((item,index)=><article key={`${item}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><p>{item}</p></article>)}</div></section>}
function protectedPhotoUrl(value:string){const match=value.match(/\/d\/([^/?#]+)/)||value.match(/[?&]id=([^&#]+)/);return match?`/api/profile-image/${encodeURIComponent(match[1])}`:value}

export default async function AboutPage(){
  let valueJson:string|undefined;
  try{const row=await env.DB.prepare("SELECT value_json valueJson FROM site_settings WHERE setting_key='teacher_profile' LIMIT 1").first<{valueJson:string}>();valueJson=row?.valueJson}catch{}
  const profile=parseTeacherProfile(valueJson);
  if(!profile.published)notFound();
  return <main className="about-page">
    <nav className="about-nav"><Link href="/learn" className="wordmark"><span className="wordmark-icon">KP</span><b>Kru Pim <small>E-learning</small></b></Link><div><a href="#profile">รู้จักครูพิม</a><a href="#teaching">แนวทางการสอน</a><a href="#student-results">ผลงานนักเรียน</a><Link className="about-nav-cta" href="/learn">กลับหน้าห้องเรียน</Link></div></nav>
    <section className="about-hero" id="profile"><div className="about-hero-copy"><span className="about-kicker">ทำความรู้จักครูผู้สอน</span><p className="about-role">{profile.role}</p><h1>{profile.name}</h1><p className="about-tagline">{profile.tagline}</p><p className="about-intro">{profile.intro}</p><Link className="about-primary" href={profile.contactUrl}>{profile.contactLabel} <span>→</span></Link></div><div className={`about-portrait ${profile.photoUrl?"has-photo":""}`}>{profile.photoUrl?<img src={protectedPhotoUrl(profile.photoUrl)} alt={`รูป${profile.name}`}/>:<Image src="/kru-pim-mascot.png" width={720} height={720} alt="กระต่ายประจำ Kru Pim E-learning" priority/>}<span className="about-orbit">π</span><small>เรียนด้วยความเข้าใจ<br/>เติบโตด้วยความมั่นใจ</small></div></section>
    {profile.subjects.length>0&&<section className="about-subjects"><span>วิชาที่สอน</span><div>{profile.subjects.map(subject=><b key={subject}>{subject}</b>)}</div></section>}
    <div className="about-content">
      <ListSection eyebrow="BACKGROUND" title="การศึกษา" items={profile.education}/>
      <ListSection eyebrow="CREDENTIALS" title="วุฒิบัตรและคุณวุฒิ" items={profile.credentials}/>
      <ListSection eyebrow="EXPERIENCE" title="ประสบการณ์สอน" items={profile.experience}/>
      <div id="teaching"><ListSection eyebrow="TEACHING STYLE" title="แนวทางการสอน" items={profile.approach}/></div>
      <ListSection eyebrow="STUDENT STORIES" title="ผลงานและความสำเร็จ" items={profile.achievements}/>
    </div>
    <StudentResultsGrid results={profile.studentResults.filter(item=>item.active!==false)}/>
    <section className="about-cta"><Image src="/kru-pim-mascot.png" width={180} height={180} alt=""/><div><span className="eyebrow">พร้อมเริ่มเรียนหรือยัง?</span><h2>มาเรียนให้เข้าใจไปด้วยกัน</h2><p>เข้าสู่พื้นที่เรียนส่วนตัวเพื่อดูคอร์ส บทเรียน และความคืบหน้าของคุณ</p></div><Link href={profile.contactUrl}>{profile.contactLabel} →</Link></section>
    <footer className="about-footer"><b>Kru Pim E-learning</b><span>พื้นที่เรียนออนไลน์ส่วนตัว</span></footer>
  </main>
}
