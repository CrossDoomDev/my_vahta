@echo off
setlocal
cd /d "%~dp0"
echo [My Vahta] Updating code from GitHub...
git pull --ff-only
if errorlevel 1 exit /b 1
if not exist ".venv\Scripts\python.exe" (
 echo [ERROR] Create .venv first. See docs\LOCAL_DJANGO_SETUP.md
 exit /b 1
)
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 exit /b 1
call "%~dp0start-local.cmd"
