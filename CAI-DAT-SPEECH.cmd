@echo off
cd /d "%~dp0"
echo Cai model PhoWhisper-base mien phi. Can Internet lan dau.
if exist .speech-venv\Scripts\python.exe goto install
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
 "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m venv .speech-venv
) else (
 py -3.12 -m venv .speech-venv
)
if errorlevel 1 goto fail
:install
.speech-venv\Scripts\python.exe -m pip install -r scripts\speech-requirements.txt
if errorlevel 1 goto fail
.speech-venv\Scripts\python.exe -m pip install torch==2.6.0 --index-url https://download.pytorch.org/whl/cpu
if errorlevel 1 goto fail
.speech-venv\Scripts\python.exe scripts\setup-speech.py
if errorlevel 1 goto fail
echo Da cai xong. Mo CHAY-SPEECH.cmd de su dung khong can Internet.
pause
exit /b 0
:fail
echo Cai dat chua thanh cong. Can Python 3.12 va ket noi Internet.
pause
exit /b 1
