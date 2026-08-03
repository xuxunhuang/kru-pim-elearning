param([string]$BaseUrl="https://krupim-mathlearning.pages.dev")
$ErrorActionPreference="Stop"
$base=$BaseUrl.TrimEnd('/')
function Request-NoRedirect([string]$Uri){
  try { return Invoke-WebRequest -UseBasicParsing $Uri -MaximumRedirection 0 -TimeoutSec 20 }
  catch [System.Net.WebException] {
    if ($_.Exception.Response) { return $_.Exception.Response }
    throw
  }
}
$health=Invoke-WebRequest -UseBasicParsing "$base/api/health" -TimeoutSec 20
if($health.StatusCode-ne 200){throw "Health check failed: $($health.StatusCode)"}
$json=$health.Content|ConvertFrom-Json
if($json.status-ne "ok"-or$json.checks.database-ne "ok"){throw "Health response is degraded"}
foreach($path in @("/","/learn","/admin")){
  $response=Request-NoRedirect "$base$path"
  $status=[int]$response.StatusCode
  if($status-notin @(200,302,303,307,308)){throw "Smoke check $path failed: $status"}
  Write-Host "$path -> $status"
}
Write-Host "Smoke checks passed for $base"