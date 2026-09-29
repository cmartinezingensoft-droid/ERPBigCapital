@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"
if errorlevel 1 (
  echo ERROR: No se pudo entrar en la carpeta del proyecto.
  exit /b 1
)

set "PROJECT_DIR=%CD%"
set "DOCKER_BIN=C:\Program Files\Docker\Docker\resources\bin"
set "RUNTIME_DIR=%PROJECT_DIR%\.runtime"
set "PATH=%DOCKER_BIN%;%PATH%"

echo.
echo === FaroERP.bigcapital: deteniendo entorno ===
echo Proyecto: %PROJECT_DIR%
echo.

echo Cerrando backend y frontend...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'SilentlyContinue';" ^
  "$runtime = '%RUNTIME_DIR%';" ^
  "$pidFiles = @('backend.pid','frontend.pid') | ForEach-Object { Join-Path $runtime $_ };" ^
  "$ids = @();" ^
  "foreach ($file in $pidFiles) { if (Test-Path -LiteralPath $file) { $ids += [int](Get-Content -LiteralPath $file -Raw) } }" ^
  "$ids += Get-NetTCPConnection -LocalPort 3000,4000,4001 | Select-Object -ExpandProperty OwningProcess;" ^
  "$ids | Where-Object { $_ -and $_ -ne $PID } | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force };" ^
  "Remove-Item -LiteralPath $pidFiles -Force"

echo Parando contenedores Docker Compose...
docker compose stop
if errorlevel 1 (
  echo AVISO: docker compose stop fallo o Docker no esta disponible.
) else (
  echo Contenedores parados. Los volumenes de MariaDB/Redis/Garage se conservan.
)

echo.
echo Entorno detenido.
echo.

endlocal
