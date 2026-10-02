@echo off
rem Doorprize Ibadah Oikumene - jalankan aplikasi di laptop operator.
setlocal
cd /d "%~dp0"

set "PY=python"
where py >nul 2>nul && set "PY=py -3"
set "VENV=backend\.venv"

if not exist "%VENV%\Scripts\python.exe" (
    echo Menyiapkan Python virtual environment, hanya sekali...
    %PY% -m venv "%VENV%" || goto :fail
)

fc /b backend\requirements.txt "%VENV%\requirements.installed" >nul 2>nul
if errorlevel 1 (
    echo Memasang dependensi Python...
    "%VENV%\Scripts\python.exe" -m pip install --disable-pip-version-check -q -r backend\requirements.txt || goto :fail
    copy /y backend\requirements.txt "%VENV%\requirements.installed" >nul
)

if not exist dist\index.html (
    where npm >nul 2>nul || goto :nodist
    echo Membangun tampilan aplikasi...
    call npm ci || goto :fail
    call npm run build || goto :fail
)

cd backend
.venv\Scripts\python.exe -m app.cli ensure-password || goto :fail
.venv\Scripts\python.exe -m app.cli backup || goto :fail
.venv\Scripts\python.exe -m app.cli serve
goto :eof

:nodist
echo Folder dist tidak ditemukan dan Node.js tidak terpasang.
echo Salin folder dist hasil "npm run build" dari komputer lain ke folder ini.
:fail
echo.
echo GAGAL - lihat pesan di atas.
pause
exit /b 1
