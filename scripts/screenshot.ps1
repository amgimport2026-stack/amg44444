$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$output = Join-Path (Resolve-Path ".\scripts") "preview.png"
$profile = Join-Path $env:TEMP "amg-screenshot-profile"

$arguments = @(
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--window-size=1440,1200",
  "--virtual-time-budget=4000",
  "--screenshot=`"$output`"",
  "--user-data-dir=$profile",
  "http://127.0.0.1:4173"
)

$process = Start-Process -FilePath $edge -ArgumentList $arguments -PassThru -Wait -NoNewWindow
Start-Sleep -Milliseconds 800

if (Test-Path -LiteralPath $output) {
  Write-Output $output
} else {
  throw "No se generó la captura de vista previa. Edge terminó con código $($process.ExitCode)."
}
