@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Install Node.js LTS 22 or later from https://nodejs.org/ then try again.
 pause
 exit /b 1
)
echo Open http://127.0.0.1:4173/ in your browser after the server starts.
node scripts\serve-dist.mjs
if errorlevel 1 pause
