#!/usr/bin/env bash
set -euo pipefail

# FaroCapital local installer. It deliberately does not download code from the
# original project or any FaroCapital-specific remote service.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker es necesario para ejecutar FaroCapital." >&2
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se ha creado .env desde .env.example. Revisa las credenciales antes de continuar."
fi

echo "Fuentes locales de FaroCapital preparadas."
echo "Desarrollo: docker compose up -d mariadb redis gotenberg garage"
echo "Producción: configura las imágenes FAROCAPITAL_* en .env y ejecuta docker compose -f docker-compose.prod.yml up -d"
