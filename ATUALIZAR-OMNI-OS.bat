@echo off
chcp 65001 >nul
title Omni-OS • Atualizar Sistema
cd /d "%~dp0"

echo [INFO] Verificando atualizacoes do Omni-OS no GitHub...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$zip=Join-Path $env:TEMP 'omni_os_update.zip';" ^
  "$ext=Join-Path $env:TEMP 'omni_os_update_ext';" ^
  "try {" ^
  "  Invoke-WebRequest -Uri 'https://github.com/alizardo57-tech/omni-os/archive/refs/heads/main.zip' -OutFile $zip -TimeoutSec 15;" ^
  "  if (Test-Path $ext) { Remove-Item $ext -Recurse -Force }" ^
  "  Expand-Archive -Path $zip -DestinationPath $ext -Force;" ^
  "  $src=Join-Path $ext 'omni-os-main';" ^
  "  robocopy $src '%~dp0.' /E /XD .git node_modules data .next /XF .env *.log | Out-Null;" ^
  "  Remove-Item $zip -Force -ErrorAction SilentlyContinue;" ^
  "  Remove-Item $ext -Recurse -Force -ErrorAction SilentlyContinue;" ^
  "  Write-Host '[OK] Omni-OS atualizado com sucesso!';" ^
  "} catch {" ^
  "  Write-Host '[AVISO] Sem internet ou repositorio ainda nao publicado. Mantendo versao local.';" ^
  "}"

if exist "CRIAR-ATALHO-DESKTOP.bat" (
  call "CRIAR-ATALHO-DESKTOP.bat" --auto
)

if "%~1"=="--auto" exit /b 0
pause >nul
