param(
  [int]$Port = 8090
)

Write-Host ""
Write-Host "QuizMaster Pro local server starting..." -ForegroundColor Cyan
Write-Host "Project folder: $PSScriptRoot" -ForegroundColor DarkGray
Write-Host "Open: http://127.0.0.1:$Port/login.html" -ForegroundColor Green
Write-Host "Press Ctrl + C to stop the server." -ForegroundColor Yellow
Write-Host ""

Set-Location $PSScriptRoot
python -m http.server $Port --bind 127.0.0.1
