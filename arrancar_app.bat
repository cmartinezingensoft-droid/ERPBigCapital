@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"
if errorlevel 1 (
  echo ERROR: No se pudo entrar en la carpeta del proyecto.
  exit /b 1
)

set "PROJECT_DIR=%CD%"
set "DOCKER_BIN=C:\Program Files\Docker\Docker\resources\bin"
set "DOCKER_DESKTOP=C:\Program Files\Docker\Docker\Docker Desktop.exe"
set "NODE18=%APPDATA%\fnm\node-versions\v18.16.1\installation"
set "RUNTIME_DIR=%PROJECT_DIR%\.runtime"
set "LOG_DIR=%PROJECT_DIR%\artifacts\logs"

if exist "%NODE18%\node.exe" (
  set "PATH=%NODE18%;%NODE18%\node_modules\corepack\shims;%DOCKER_BIN%;%PATH%"
  set "NODE_EXE=%NODE18%\node.exe"
) else (
  set "PATH=%DOCKER_BIN%;%PATH%"
  for /f "delims=" %%I in ('where node 2^>nul') do (
    set "NODE_EXE=%%I"
    goto node_found
  )
)

:node_found
if not defined NODE_EXE (
  echo ERROR: No se encontro Node. Instala/activa Node 18 y vuelve a ejecutar.
  exit /b 1
)

if not exist "%RUNTIME_DIR%" mkdir "%RUNTIME_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo === FaroERP.bigcapital: arrancando entorno ===
echo Proyecto: %PROJECT_DIR%
echo Logs    : %LOG_DIR%
echo.

if exist "%DOCKER_DESKTOP%" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%DOCKER_DESKTOP%' -WindowStyle Hidden" >nul 2>nul
)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Service com.docker.service -ErrorAction SilentlyContinue" >nul 2>nul

echo Esperando a Docker...
set "DOCKER_READY="
for /L %%I in (1,1,60) do (
  docker info >nul 2>nul
  if not errorlevel 1 (
    set "DOCKER_READY=1"
    goto docker_ready
  )
  timeout /t 2 /nobreak >nul
)

:docker_ready
if not defined DOCKER_READY (
  echo ERROR: Docker no esta disponible. Abre Docker Desktop y vuelve a ejecutar este script.
  exit /b 1
)

echo Cerrando instancias previas de frontend/backend...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'SilentlyContinue';" ^
  "$runtime = '%RUNTIME_DIR%';" ^
  "$pidFiles = @('backend.pid','frontend.pid') | ForEach-Object { Join-Path $runtime $_ };" ^
  "$ids = @();" ^
  "foreach ($file in $pidFiles) { if (Test-Path -LiteralPath $file) { $ids += [int](Get-Content -LiteralPath $file -Raw) } }" ^
  "$ids += Get-NetTCPConnection -LocalPort 3000,4000,4001 | Select-Object -ExpandProperty OwningProcess;" ^
  "$ids | Where-Object { $_ -and $_ -ne $PID } | Select-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force };" ^
  "Remove-Item -LiteralPath $pidFiles -Force"

echo Levantando MariaDB, Redis, Gotenberg y Garage...
docker compose up -d mariadb redis gotenberg garage
if errorlevel 1 (
  echo ERROR: docker compose up -d fallo.
  exit /b 1
)

echo Preparando Garage/S3 si es necesario...
set "GARAGE_NODE="
for /f "tokens=1" %%I in ('docker compose exec -T garage /garage node id 2^>nul') do (
  set "GARAGE_NODE=%%I"
  goto garage_node_found
)

:garage_node_found
if defined GARAGE_NODE (
  docker compose exec -T garage /garage layout assign !GARAGE_NODE! -z dc1 -c 10G >nul 2>nul
  docker compose exec -T garage /garage layout apply --version 1 >nul 2>nul
  docker compose exec -T garage /garage bucket create bigcapital >nul 2>nul
  docker compose exec -T garage /garage key info bigcapital >nul 2>nul
  if errorlevel 1 docker compose exec -T garage /garage key create bigcapital
  docker compose exec -T garage /garage bucket allow bigcapital --read --write --owner --key bigcapital >nul 2>nul
) else (
  echo AVISO: No se pudo leer el nodo de Garage. Continuo igualmente.
)

if not exist "%PROJECT_DIR%\node_modules\.pnpm" (
  echo Instalando dependencias pnpm...
  call corepack prepare pnpm@9.1.2 --activate
  call pnpm install --frozen-lockfile
  if errorlevel 1 (
    echo ERROR: pnpm install fallo.
    exit /b 1
  )
)

if not exist "%PROJECT_DIR%\shared\email-components\dist\email-components.umd.js" (
  echo Compilando @farocapital/email-components...
  call pnpm --filter @farocapital/email-components build
  if errorlevel 1 exit /b 1
)

if not exist "%PROJECT_DIR%\shared\pdf-templates\dist\components.umd.js" (
  echo Compilando @farocapital/pdf-templates...
  call pnpm --filter @farocapital/pdf-templates build
  if errorlevel 1 exit /b 1
)

echo Compilando backend...
call pnpm build:server
if errorlevel 1 (
  echo ERROR: build del backend fallo.
  exit /b 1
)

echo Arrancando backend en http://localhost:3000/ ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "Set-Content -LiteralPath '%LOG_DIR%\backend.log' -Value '';" ^
  "Set-Content -LiteralPath '%LOG_DIR%\backend.err.log' -Value '';" ^
  "$env:PORT = '3000';" ^
  "$p = Start-Process -FilePath '%NODE_EXE%' -ArgumentList 'dist\main.js' -WorkingDirectory '%PROJECT_DIR%\packages\server' -RedirectStandardOutput '%LOG_DIR%\backend.log' -RedirectStandardError '%LOG_DIR%\backend.err.log' -WindowStyle Hidden -PassThru;" ^
  "Set-Content -LiteralPath '%RUNTIME_DIR%\backend.pid' -Value $p.Id"
if errorlevel 1 (
  echo ERROR: no se pudo arrancar el backend.
  exit /b 1
)

echo Arrancando frontend en http://localhost:4000/ ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$p = Start-Process -FilePath 'pnpm.cmd' -ArgumentList 'dev:webapp' -WorkingDirectory '%PROJECT_DIR%' -RedirectStandardOutput '%LOG_DIR%\frontend.log' -RedirectStandardError '%LOG_DIR%\frontend.err.log' -WindowStyle Hidden -PassThru;" ^
  "Set-Content -LiteralPath '%RUNTIME_DIR%\frontend.pid' -Value $p.Id"
if errorlevel 1 (
  echo ERROR: no se pudo arrancar el frontend.
  exit /b 1
)

echo Esperando a que respondan backend y frontend...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "function Show-LogTail([string]$Path) {" ^
  "  if (Test-Path -LiteralPath $Path) { Write-Host ''; Write-Host ('--- ' + $Path + ' ---'); Get-Content -LiteralPath $Path -Tail 80 }" ^
  "}" ^
  "function Test-ProcessAlive([string]$PidFile, [string]$Name) {" ^
  "  if (-not (Test-Path -LiteralPath $PidFile)) { throw \"$Name no tiene fichero PID\" }" ^
  "  $id = [int](Get-Content -LiteralPath $PidFile -Raw);" ^
  "  if (-not (Get-Process -Id $id -ErrorAction SilentlyContinue)) { throw \"$Name se cerro durante el arranque\" }" ^
  "}" ^
  "function Wait-Http([string]$Url, [string]$Name, [int]$Seconds) {" ^
  "  $lastError = '';" ^
  "  for ($i = 0; $i -lt $Seconds; $i++) {" ^
  "    try {" ^
  "      $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 5;" ^
  "      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { return }" ^
  "      $lastError = \"HTTP $($response.StatusCode)\";" ^
  "    } catch { $lastError = $_.Exception.Message }" ^
  "    Start-Sleep -Seconds 1;" ^
  "  }" ^
  "  throw \"$Name no respondio en $Url tras $Seconds segundos. Ultimo error: $lastError\"" ^
  "}" ^
  "try {" ^
  "  Test-ProcessAlive '%RUNTIME_DIR%\backend.pid' 'Backend';" ^
  "  Test-ProcessAlive '%RUNTIME_DIR%\frontend.pid' 'Frontend';" ^
  "  Wait-Http 'http://localhost:3000/swagger' 'Backend' 180;" ^
  "  Wait-Http 'http://localhost:4000/' 'Frontend' 120;" ^
  "} catch {" ^
  "  Write-Host $_.Exception.Message;" ^
  "  Show-LogTail '%LOG_DIR%\backend.log';" ^
  "  Show-LogTail '%LOG_DIR%\backend.err.log';" ^
  "  Show-LogTail '%LOG_DIR%\frontend.log';" ^
  "  Show-LogTail '%LOG_DIR%\frontend.err.log';" ^
  "  exit 1;" ^
  "}"
if errorlevel 1 (
  echo ERROR: el entorno no quedo listo.
  echo Revisa:
  echo   %LOG_DIR%\backend.log
  echo   %LOG_DIR%\backend.err.log
  echo   %LOG_DIR%\frontend.log
  echo   %LOG_DIR%\frontend.err.log
  exit /b 1
)

echo.
echo Entorno arrancado correctamente.
echo Frontend: http://localhost:4000/
echo Backend : http://localhost:3000/
echo Logs    : %LOG_DIR%
echo.

endlocal
