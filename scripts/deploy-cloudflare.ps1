$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $projectRoot

Write-Host "Building Kru Pim E-learning..."
pnpm run build

$deployDir = Join-Path $projectRoot "pages-dist"
$resolvedRoot = [IO.Path]::GetFullPath($projectRoot).TrimEnd('\')
$resolvedDeploy = [IO.Path]::GetFullPath($deployDir).TrimEnd('\')
if (-not $resolvedDeploy.StartsWith($resolvedRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
  throw "Unsafe deployment directory: $resolvedDeploy"
}
if (Test-Path -LiteralPath $deployDir) {
  Remove-Item -LiteralPath $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

Copy-Item -Path (Join-Path $projectRoot "dist\client\*") -Destination $deployDir -Recurse -Force
Copy-Item -Path (Join-Path $projectRoot "dist\server") -Destination (Join-Path $deployDir "_worker.js") -Recurse -Force

Get-ChildItem -LiteralPath (Join-Path $deployDir "_worker.js") -Filter "wrangler*.json*" -File -ErrorAction SilentlyContinue | Remove-Item -Force
$generatedDeployDir = Join-Path $projectRoot ".wrangler\deploy"
if (Test-Path -LiteralPath $generatedDeployDir) {
  Remove-Item -LiteralPath $generatedDeployDir -Recurse -Force
}

$routesSource = Join-Path $projectRoot "public\_routes.json"
$routesDestination = Join-Path $deployDir "_routes.json"
if ((Test-Path -LiteralPath $routesSource) -and -not (Test-Path -LiteralPath $routesDestination)) {
  Copy-Item -LiteralPath $routesSource -Destination $routesDestination
}

$workerEntry = Join-Path $deployDir "_worker.js\index.js"
if (Test-Path -LiteralPath $workerEntry) {
  pnpm exec terser $workerEntry --compress --mangle --output $workerEntry
}

$pagesConfig = @"
{
  `"`$schema`": `"../node_modules/wrangler/config-schema.json`",
  `"name`": `"krupim-mathlearning`",
  `"pages_build_output_dir`": `".`",
  `"compatibility_date`": `"2026-07-27`",
  `"compatibility_flags`": [`"nodejs_compat`"],
  `"d1_databases`": [{
    `"binding`": `"DB`",
    `"database_name`": `"krupim-mathlearning`",
    `"database_id`": `"ee528e6d-9fb4-4b6b-9930-c7c40358e4fa`",
    `"migrations_dir`": `"../drizzle`"
  }]
}
"@
[IO.File]::WriteAllText((Join-Path $deployDir "wrangler.jsonc"), $pagesConfig, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Deploying to existing Cloudflare Pages project: krupim-mathlearning"
Push-Location $deployDir
try {
  pnpm exec wrangler pages deploy . --project-name krupim-mathlearning
} finally {
  Pop-Location
}