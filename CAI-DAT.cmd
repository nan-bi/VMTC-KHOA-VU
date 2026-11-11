@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if errorlevel 1 (
 echo Install Node.js LTS 22 or later from https://nodejs.org/ then try again.
 pause
 exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<22){console.error('Node.js 22 or later is required.');process.exit(1)}"
if errorlevel 1 (
 pause
 exit /b 1
)
call npm.cmd ci
if errorlevel 1 (
 echo Install failed. Check your internet connection and retry.
 pause
 exit /b 1
)
echo Ready. Run CHAY-CODE.cmd to develop or npm run build to update the demo.
pause
