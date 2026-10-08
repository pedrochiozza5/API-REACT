#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "Instalando dependencias..."
npm install
echo "Inicializando base..."
npm run setup:demo
echo "Listo. Usá ./02_INICIAR_LOCAL.sh"
