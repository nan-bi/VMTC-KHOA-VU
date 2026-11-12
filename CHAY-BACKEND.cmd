@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js 22.14 or newer first.
 pause
 exit /b 1
)
echo Internal dashboard: http://127.0.0.1:4180/
node backend\server.mjs
if errorlevel 1 pause
