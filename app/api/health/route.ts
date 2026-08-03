import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
export async function GET(){const startedAt=Date.now();try{const result=await env.DB.prepare("SELECT 1 AS ok").first<{ok:number}>();if(result?.ok!==1)throw new Error("probe failed");return NextResponse.json({status:"ok",checks:{app:"ok",database:"ok"},durationMs:Date.now()-startedAt},{headers:{"cache-control":"no-store"}})}catch{return NextResponse.json({status:"degraded",checks:{app:"ok",database:"unavailable"}},{status:503,headers:{"cache-control":"no-store"}})}}
