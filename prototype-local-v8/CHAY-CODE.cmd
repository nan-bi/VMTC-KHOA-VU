@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\vite\bin\vite.js (
 echo Run CAI-DAT.cmd first.
 pause
 exit /b 1
)
call npm.cmd run dev
if errorlevel 1 pause
