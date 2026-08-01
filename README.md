# Kru Pim E-learning

Production e-learning system for Kru Pim.

## Source of truth

- Work only from the local repository: `C:\Users\pokis\Projects\kru-pim-elearning`
- GitHub is the private remote backup and collaboration source.
- Production remains the existing Cloudflare Pages project `krupim-mathlearning`.
- Google Drive is for approved learning media and student-result images only. Do not edit or sync source code through Google Drive.

## Standard workflow

1. Pull the latest `main` branch before starting work.
2. Create a short-lived feature/fix branch for non-trivial changes.
3. Run `pnpm install --frozen-lockfile` when dependencies change.
4. Run `pnpm run build` before every commit or deployment.
5. Review `git diff` and confirm that no credentials or generated files are staged.
6. Commit with a clear message and push to the private GitHub repository.
7. Deploy only to the existing Cloudflare Pages project with `pnpm run deploy:production`.
8. Verify https://krupim-mathlearning.pages.dev after deployment.

## Local setup

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env.local
pnpm run dev
```

Keep real credentials in local environment files and Cloudflare secrets. Never commit OAuth client secrets, service-account JSON files, private keys, or Wrangler `.dev.vars` files.

## Production deployment

```powershell
pnpm run build
pnpm run deploy:production
```

The deploy script targets the existing `krupim-mathlearning` Pages project. It must not create a new Pages project.

## Database and media

- Application data is stored in the configured Cloudflare database/bindings.
- Google Drive may continue to store private video/PDF media and approved student images, but it is not a source-code repository.
- Back up production data separately from Git source history.