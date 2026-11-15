@echo off
chcp 65001 >nul
title Omni-OS • Tudo conectado. Tudo sob controle.
cd /d "%~dp0"

set "PATH=%PATH%;C:\Program Files\nodejs"

powershell -NoProfile -Command "try { $r=Invoke-WebRequest -Uri 'http://localhost:3005/api/health' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  goto :abrir_tela_cheia
)

where node >nul 2>&1
if errorlevel 1 (
  echo [INFO] Instalando Node.js LTS automaticamente...
  where winget >nul 2>&1
  if not errorlevel 1 (
    winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
  )
  set "PATH=%PATH%;C:\Program Files\nodejs"
)

if exist "ATUALIZAR-OMNI-OS.bat" (
  call "ATUALIZAR-OMNI-OS.bat" --auto
)

if not exist "node_modules" (
  echo Instalando dependencias do Omni-OS...
  call npm install
)

if not exist ".next" (
  echo Compilando Omni-OS...
  call npm run build
)

powershell -NoProfile -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/c set PORT=3005&& npx next start -p 3005' -WorkingDirectory '%~dp0' -WindowStyle Hidden"

timeout /t 3 /nobreak >nul
:abrir_tela_cheia
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3005 --start-fullscreen
  exit /b 0
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:3005 --start-fullscreen
  exit /b 0
)
start "" "http://localhost:3005"
exit /b 0
