@echo off
chcp 65001 >nul
title Omni-OS • Atualizar Sistema
cd /d "%~dp0"

if exist ".no-auto-update" (
  echo [AVISO] Atualizacao via GitHub bloqueada localmente por .no-auto-update.
  if "%~1"=="--auto" exit /b 0
  pause
  exit /b 0
)

set "PATH=%PATH%;C:\Program Files\nodejs"

echo [1/4] Fechando servidor Node em execucao para liberar arquivos...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Baixando ultima versao do GitHub...
set "ATUALIZOU=0"
where git >nul 2>&1
if not errorlevel 1 (
  if exist ".git" (
    git fetch origin main
    if not errorlevel 1 (
      git reset --hard origin/main
      if not errorlevel 1 (
        set "ATUALIZOU=1"
      )
    )
  )
)

if "%ATUALIZOU%"=="0" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ErrorActionPreference='Stop';" ^
    "$zip=Join-Path $env:TEMP 'omni_os_update.zip';" ^
    "$ext=Join-Path $env:TEMP 'omni_os_update_ext';" ^
    "try {" ^
    "  Invoke-WebRequest -Uri 'https://github.com/alizardo57-tech/omni-os/archive/refs/heads/main.zip' -OutFile $zip -TimeoutSec 60;" ^
    "  if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }" ^
    "  Expand-Archive -Path $zip -DestinationPath $ext -Force;" ^
    "  $src=Join-Path $ext 'omni-os-main';" ^
    "  robocopy $src '%~dp0.' /E /XD .git node_modules data .next /XF .env *.log | Out-Null;" ^
    "  Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
    "  Remove-Item $ext -Recurse -Force -ErrorAction SilentlyContinue;" ^
    "  Write-Host '[OK] Codigo atualizado!';" ^
    "  exit 0;" ^
    "} catch {" ^
    "  Write-Host '[AVISO] Sem internet ou falha no download. Mantendo versao local.';" ^
    "  exit 1;" ^
    "}"
  if not errorlevel 1 set "ATUALIZOU=1"
)

if "%ATUALIZOU%"=="1" (
  echo [3/4] Instalando dependencias e recompilando Omni-OS...
  where npm >nul 2>&1
  if not errorlevel 1 (
    if exist ".next" rmdir /s /q ".next" >nul 2>&1
    call npm install
    call npm run build
    if errorlevel 1 (
      echo [ERRO] Falha ao compilar o Omni-OS. Veja a mensagem acima.
    ) else (
      echo [OK] Omni-OS atualizado e compilado com sucesso!
    )
  ) else (
    echo [ERRO] npm nao encontrado no PATH.
  )
)

echo [4/4] Atualizando atalho...
if exist "CRIAR-ATALHO-DESKTOP.bat" (
  call "CRIAR-ATALHO-DESKTOP.bat" --auto
)

if "%~1"=="--auto" exit /b 0
echo.
echo Pressione qualquer tecla para iniciar o Omni-OS atualizado...
pause >nul
if exist "INICIAR-OMNI-OS.bat" (
  call "INICIAR-OMNI-OS.bat"
)
