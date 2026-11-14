@echo off
chcp 65001 >nul
title Omni-OS • Criar Atalho na Area de Trabalho
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$desk = [Environment]::GetFolderPath('Desktop');" ^
  "$lnk = Join-Path $desk 'Omni-OS.lnk';" ^
  "$s = $ws.CreateShortcut($lnk);" ^
  "$s.TargetPath = '%~dp0INICIAR-OMNI-OS.bat';" ^
  "$s.WorkingDirectory = '%~dp0';" ^
  "$s.IconLocation = '%~dp0omni-os.ico,0';" ^
  "$s.Description = 'Omni-OS - Tudo conectado. Tudo sob controle.';" ^
  "$s.Save();" ^
  "Write-Host '[OK] Atalho Omni-OS criado na Area de Trabalho:' $lnk"

if "%~1"=="--auto" exit /b 0
pause
