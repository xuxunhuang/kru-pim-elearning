export type StudentResult = { name: string; program: string; institution: string; year: string; photoUrl: string; active?: boolean };
export type TeacherProfile = {
  name: string; role: string; tagline: string; photoUrl: string; intro: string;
  education: string[]; credentials: string[]; experience: string[]; subjects: string[];
  approach: string[]; achievements: string[]; studentResults: StudentResult[]; contactLabel: string; contactUrl: string; published: boolean;
};
export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  name: "ครูพิม", role: "ครูผู้สอนคณิตศาสตร์",
  tagline: "ค่อย ๆ เข้าใจพื้นฐาน ฝึกคิดอย่างเป็นระบบ และมั่นใจขึ้นในทุกบทเรียน",
  photoUrl: "", intro: "พื้นที่แนะนำครูผู้สอน หลักการสอน และข้อมูลที่ช่วยให้นักเรียนกับผู้ปกครองรู้จักครูพิมมากขึ้น",
  education: [], credentials: [], experience: [], subjects: [], approach: [], achievements: [], studentResults: [],
  contactLabel: "กลับหน้าห้องเรียน", contactUrl: "/learn", published: true,
};
const text=(value:unknown,fallback="",max=2000)=>String(value??fallback).trim().slice(0,max);
const list=(value:unknown)=>{const source=Array.isArray(value)?value:String(value??"").split(/\r?\n/);return source.map(item=>text(item,"",300)).filter(Boolean).slice(0,30)};
const safeUrl=(value:unknown,fallback:string,allowRelative=false)=>{const candidate=text(value,fallback,1000);if(allowRelative&&candidate.startsWith("/"))return candidate;try{const url=new URL(candidate);return ["http:","https:"].includes(url.protocol)?candidate:fallback}catch{return fallback}};
const studentResults=(value:unknown):StudentResult[]=>{let source:unknown=value;if(typeof value==="string"){try{source=JSON.parse(value)}catch{return []}}return Array.isArray(source)?source.map(item=>{const row=(item&&typeof item==="object"?item:{}) as Record<string,unknown>;return {name:text(row.name,"",100),program:text(row.program,"",160),institution:text(row.institution,"",160),year:text(row.year,"",20),photoUrl:safeUrl(row.photoUrl,""),active:row.active!==false}}).filter(item=>item.name&&item.program&&item.institution&&item.year&&item.photoUrl).slice(0,200):[]};
export function normalizeTeacherProfile(value:Record<string,unknown>):TeacherProfile{return {
  name:text(value.name,DEFAULT_TEACHER_PROFILE.name,120),role:text(value.role,DEFAULT_TEACHER_PROFILE.role,160),tagline:text(value.tagline,DEFAULT_TEACHER_PROFILE.tagline,300),
  photoUrl:value.photoUrl?safeUrl(value.photoUrl,""):"",intro:text(value.intro,DEFAULT_TEACHER_PROFILE.intro,3000),education:list(value.education),credentials:list(value.credentials),
  experience:list(value.experience),subjects:list(value.subjects),approach:list(value.approach),achievements:list(value.achievements),studentResults:studentResults(value.studentResults),contactLabel:text(value.contactLabel,DEFAULT_TEACHER_PROFILE.contactLabel,80),
  contactUrl:safeUrl(value.contactUrl,DEFAULT_TEACHER_PROFILE.contactUrl,true),published:value.published===true||value.published==="true"||value.published==="on",
}}
export function parseTeacherProfile(value?:string|null):TeacherProfile{if(!value)return DEFAULT_TEACHER_PROFILE;try{return normalizeTeacherProfile(JSON.parse(value) as Record<string,unknown>)}catch{return DEFAULT_TEACHER_PROFILE}}
