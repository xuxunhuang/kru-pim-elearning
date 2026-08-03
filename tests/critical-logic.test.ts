import test from "node:test";import assert from "node:assert/strict";
import{canStartAttempt,isAdminRoleValue,isAttemptExpired,isProgressComplete,isWithinAccessWindow,scorePercent}from"../lib/critical-logic.ts";
test("admin roles",()=>{for(const role of["owner","admin","teacher","assistant"])assert.equal(isAdminRoleValue(role),true);assert.equal(isAdminRoleValue("student"),false)});
test("access window",()=>{const now=new Date("2026-08-03T12:00:00Z");assert.equal(isWithinAccessWindow(now,now.toISOString(),now.toISOString()),true);assert.equal(isWithinAccessWindow(now,"invalid",now.toISOString()),false)});
test("90 percent progress",()=>{assert.equal(isProgressComplete(89.9,100),false);assert.equal(isProgressComplete(90,100),true);assert.equal(isProgressComplete(1,0),false)});
test("quiz guards",()=>{const now=new Date("2026-08-03T12:00:00Z");assert.equal(isAttemptExpired(now,"2026-08-03T12:00:00Z"),true);assert.equal(isAttemptExpired(now,"2026-08-03T12:00:01Z"),false);assert.equal(canStartAttempt(0,1),true);assert.equal(canStartAttempt(1,1),false);assert.equal(scorePercent(9,10),90);assert.equal(scorePercent(1,0),null);assert.equal(scorePercent(12,10),100)});
