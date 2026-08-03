export const ADMIN_ROLES = ["owner", "admin", "teacher", "assistant"] as const;
export function isAdminRoleValue(role:string){return (ADMIN_ROLES as readonly string[]).includes(role)}
export function isWithinAccessWindow(now:Date,startsAt:string,endsAt:string){const value=now.getTime(),start=Date.parse(startsAt),end=Date.parse(endsAt);return Number.isFinite(start)&&Number.isFinite(end)&&start<=value&&value<=end}
export function isProgressComplete(position:number,duration:number){return Number.isFinite(position)&&Number.isFinite(duration)&&duration>0&&Math.max(0,position)/duration>=.9}
export function isAttemptExpired(now:Date,expiresAt:string){const expiry=Date.parse(expiresAt);return !Number.isFinite(expiry)||now.getTime()>=expiry}
export function canStartAttempt(existing:number,max:number){return Number.isInteger(existing)&&Number.isInteger(max)&&existing>=0&&max>0&&existing<max}
export function scorePercent(score:number,max:number){return Number.isFinite(score)&&Number.isFinite(max)&&max>0?Math.max(0,Math.min(100,Math.round(score/max*100))):null}
