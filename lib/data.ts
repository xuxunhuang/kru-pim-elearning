import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { sha256 } from "./auth";

export type AppUser = { id:string; email:string; displayName:string; role:string; sessionId:string; deviceId:string };
export async function fingerprint(){ const h=await headers(); const ip=h.get("cf-connecting-ip")||h.get("x-forwarded-for")||"unknown"; return sha256(`${process.env.IP_HASH_SECRET||"kp"}:${ip.split(",")[0]}`); }
export function maskEmail(email:string){ const [n,d="gmail.com"]=email.split("@"); return `${n.slice(0,3)}***@${d}`; }
export function isAdminRole(role:string){ return ["owner","admin","teacher","assistant"].includes(role); }
export function assertAdmin(user:AppUser){ if(!isAdminRole(user.role)) throw new Error("FORBIDDEN"); }
export async function usage(user:AppUser,eventType:string,lessonId?:string,detail?:unknown){ await env.DB.prepare(`INSERT INTO usage_events(id,user_id,lesson_id,session_id,event_type,detail_json,ip_hash,occurred_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)`).bind(crypto.randomUUID(),user.id,lessonId||null,user.sessionId,eventType,detail?JSON.stringify(detail):null,await fingerprint(),new Date().toISOString()).run(); }
