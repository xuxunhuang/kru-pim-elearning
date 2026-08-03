# Production operations runbook

## Monitoring

Probe `GET /api/health` every five minutes from an external monitor. Expect HTTP 200 with `status=ok`; alert after two consecutive failures. The endpoint performs only `SELECT 1`, returns no configuration or database contents, and disables caching. Also alert on elevated 5xx rate, login failures, and latency. Never log session cookies, OAuth codes, tokens, or request bodies.

## Backups

Run `pnpm db:backup` daily. It uses Cloudflare's read-only remote export and writes a SQL file plus SHA-256 checksum under `backups/` (gitignored). Copy both to encrypted off-site storage. Retain 7 daily, 5 weekly, and 12 monthly snapshots. Review backup job failure every day. Export before every migration.

## Restore drill

Quarterly, select a recent snapshot, verify its checksum, then run `pnpm db:restore:local -- -BackupFile <path> -ConfirmLocalRestore`. This command deliberately targets only the local D1 emulator. Start the application against local D1 and verify login fixtures, enrollments, lesson progress, and quiz reports. Record date, operator, snapshot, duration, and discrepancies. A production restore requires a separate incident change plan, current backup, named approver, maintenance window, and Cloudflare procedure review.

## Incident response

1. Confirm impact using `/api/health` and Cloudflare logs; avoid exposing user data.
2. Stop risky deploys and capture deployment ID, timestamps, and relevant sanitized logs.
3. For an application regression, roll back to the last known-good Pages deployment. For data issues, do not import or modify D1 until scope and recovery point are approved.
4. Rotate credentials immediately if exposure is suspected, revoke active sessions as appropriate, and preserve evidence.
5. Run `pnpm smoke` after mitigation. Notify affected users when required and write a blameless review with corrective actions.

## Deployment verification

Before deploy: clean build, lint, type check, tests, migration review, and backup. After an authorized deploy, run `pnpm smoke`; verify authenticated learner/admin flows manually with test accounts. The smoke script is read-only and never deploys.

## Legal/public pages

Privacy notice, terms, retention disclosure, and consent wording require owner/legal-approved copy (especially for minors and student-result images); they must not be invented during technical hardening.
