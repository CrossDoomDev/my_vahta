@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
 echo [ERROR] Create Python environment first. See docs\LOCAL_DJANGO_SETUP.md
 exit /b 1
)
if not exist ".env" (
 echo [ERROR] Copy .env.example to .env and configure PostgreSQL and SECRET_KEY.
 exit /b 1
)
echo [My Vahta] Applying PostgreSQL migrations...
".venv\Scripts\python.exe" backend\manage.py migrate
if errorlevel 1 exit /b 1
echo [My Vahta] Open http://127.0.0.1:8000/
".venv\Scripts\python.exe" backend\manage.py runserver 127.0.0.1:8000
