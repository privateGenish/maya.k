#!/bin/sh
npm exec n8n import:workflow -- --input=/opt/echo.json
npm exec n8n update:workflow -- --id=echo --active=true
nohup npm exec n8n start > /tmp/n8n.log 2>&1 &
sleep 15
exec /lambda-entrypoint.sh "$@"