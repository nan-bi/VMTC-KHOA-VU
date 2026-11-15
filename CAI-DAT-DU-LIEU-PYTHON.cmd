@echo off
cd /d "%~dp0"
if not exist ".speech-venv\Scripts\python.exe" (
  py -3 -m venv .speech-venv
  if errorlevel 1 exit /b 1
)
".speech-venv\Scripts\python.exe" -m pip install -r backend\python\requirements.txt
if errorlevel 1 exit /b 1
echo Da cai thu vien du lieu Python. Mo dashboard noi bo de su dung.
pause
