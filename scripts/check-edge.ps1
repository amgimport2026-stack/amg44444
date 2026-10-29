$process = Get-Process msedge -ErrorAction SilentlyContinue | Select-Object -First 1
if ($process) {
  $process.Path
}

@(
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path -LiteralPath $_ }
