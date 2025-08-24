#!/bin/sh
npm exec n8n import:workflow -- --input=/opt/echo.json
npm exec n8n update:workflow -- --id=echo --active=true
npm exec n8n start &
sleep 10
exec /lambda-entrypoint.sh "$@"