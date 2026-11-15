@echo off
cd /d "%~dp0"
echo Dashboard + Speech local: http://127.0.0.1:4180/
echo Giu cua so nay mo trong khi su dung.
node scripts/start-dashboard-speech.mjs
pause
