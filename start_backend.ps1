$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = "C:\Users\Siddhesh\AppData\Local\Programs\Python\Python312\python.exe"
$appPath = Join-Path $projectRoot "TumorNet-Backend\app.py"
$backendLog = Join-Path $projectRoot "TumorNet-Backend\backend-current.log"
$backendErrorLog = Join-Path $projectRoot "TumorNet-Backend\backend-current-error.log"

Get-CimInstance Win32_Process -Filter "name = 'python.exe'" |
  Where-Object { $_.CommandLine -like "*TumorNet-Backend*app.py*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Start-Process `
  -FilePath $pythonExe `
  -ArgumentList @("-E", "`"$appPath`"") `
  -WorkingDirectory $projectRoot `
  -RedirectStandardOutput $backendLog `
  -RedirectStandardError $backendErrorLog `
  -WindowStyle Hidden

Start-Sleep -Seconds 2
Write-Host "TumorNet backend started on http://127.0.0.1:5050"
Write-Host "Health check: http://127.0.0.1:5050/health"
