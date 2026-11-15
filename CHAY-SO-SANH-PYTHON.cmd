@echo off
setlocal
cd /d "%~dp0"
set "VINMEC_PORT=4190"
echo Dashboard so sanh Python: http://127.0.0.1:4190/
echo Dung cung kho dashboard. Speech van luu trong trinh duyet 4173.
echo Giu cua so nay mo. Ctrl+C de dung ban so sanh.
node backend/server.mjs
pause
