@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Generates a source ZIP with the files needed to install dependencies and build the app.
rem It intentionally excludes node_modules, generated builds, caches, logs, local secrets, and previous ZIPs.

cd /d "%~dp0"
if errorlevel 1 (
  echo ERROR: No se pudo entrar en la carpeta del proyecto.
  exit /b 1
)

set "APP_NAME=FaroERP.farocapital"
set "OUT_DIR=%CD%\artifacts"

for /f %%I in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%I"

set "STAGE_ROOT=%TEMP%\%APP_NAME%-fuentes-%STAMP%"
set "STAGE_DIR=%STAGE_ROOT%\%APP_NAME%"
set "ZIP_FILE=%OUT_DIR%\%APP_NAME%-fuentes-%STAMP%.zip"

echo.
echo Generando ZIP de fuentes...
echo Proyecto : %CD%
echo Destino  : %ZIP_FILE%
echo.

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
if errorlevel 1 (
  echo ERROR: No se pudo crear la carpeta "%OUT_DIR%".
  exit /b 1
)

if exist "%STAGE_ROOT%" rmdir /s /q "%STAGE_ROOT%"
mkdir "%STAGE_DIR%"
if errorlevel 1 (
  echo ERROR: No se pudo crear la carpeta temporal "%STAGE_DIR%".
  exit /b 1
)

robocopy "%CD%" "%STAGE_DIR%" /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NP /NFL /NDL /NJH /NJS ^
  /XD ".git" "node_modules" "dist" "build" "coverage" ".next" ".turbo" ".cache" "tmp" "temp" "logs" "artifacts" ".codegraph" ^
  /XF ".env" "*.local" "*.log" "*.tmp" "*.zip" "pnpm-debug.log*" "npm-debug.log*" "yarn-debug.log*" "yarn-error.log*"

set "ROBOCOPY_EXIT=%ERRORLEVEL%"
if %ROBOCOPY_EXIT% GEQ 8 (
  echo ERROR: Robocopy fallo con codigo %ROBOCOPY_EXIT%.
  rmdir /s /q "%STAGE_ROOT%" >nul 2>nul
  exit /b %ROBOCOPY_EXIT%
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "if (Test-Path -LiteralPath '%ZIP_FILE%') { Remove-Item -LiteralPath '%ZIP_FILE%' -Force };" ^
  "Compress-Archive -LiteralPath '%STAGE_DIR%' -DestinationPath '%ZIP_FILE%' -CompressionLevel Optimal"

if errorlevel 1 (
  echo ERROR: No se pudo crear el ZIP.
  rmdir /s /q "%STAGE_ROOT%" >nul 2>nul
  exit /b 1
)

rmdir /s /q "%STAGE_ROOT%" >nul 2>nul

echo.
echo ZIP generado correctamente:
echo %ZIP_FILE%
echo.
echo Nota: el ZIP no incluye .env locales ni node_modules. Usa los .env.example y ejecuta pnpm install para preparar dependencias.

endlocal
