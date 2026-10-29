$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$scriptsRoot = Resolve-Path ".\scripts"
$output = Join-Path $scriptsRoot "rendered.html"
$errors = Join-Path $scriptsRoot "render-errors.log"
$profile = Join-Path $env:TEMP "amg-render-profile"

$arguments = @(
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--window-size=1440,1200",
  "--virtual-time-budget=5000",
  "--dump-dom",
  "--user-data-dir=$profile",
  "http://127.0.0.1:4173"
)

$process = Start-Process `
  -FilePath $edge `
  -ArgumentList $arguments `
  -PassThru `
  -Wait `
  -NoNewWindow `
  -RedirectStandardOutput $output `
  -RedirectStandardError $errors

Write-Output "Edge exit code: $($process.ExitCode)"
Write-Output "DOM: $output"
Write-Output "Errors: $errors"
