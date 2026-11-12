@echo off
setlocal
cd /d "%~dp0"
node backend\manage.mjs create-user
pause
