@echo off
title Sona Propostas - servidor (feche esta janela para parar)
cd /d "%~dp0"

rem Node instalado localmente (sem admin). Se estiver no PATH, tambem funciona.
if exist "%LOCALAPPDATA%\Programs\node-v22.23.2-win-x64\node.exe" set "PATH=%LOCALAPPDATA%\Programs\node-v22.23.2-win-x64;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nao encontrado. Fale com o suporte para reinstalar.
  echo.
  pause
  exit /b 1
)

if not exist "dist\index.html" (
  echo Preparando o app pela primeira vez. Isso pode levar um minuto...
  call npm install --no-audit --no-fund
  call npm run build
)

rem Abre o navegador depois de 2 segundos, em paralelo com o servidor.
start "" cmd /c "timeout /t 2 >nul & start "" http://localhost:4317"

echo.
echo  SONA PROPOSTAS esta iniciando em http://localhost:4317
echo  (Feche esta janela para parar o sistema.)
echo.
node server\index.mjs
