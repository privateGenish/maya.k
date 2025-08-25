#!/bin/sh
npm exec n8n import:workflow -- --input=/opt/echo.json
npm exec n8n update:workflow -- --id=echo --active=true
echo "Starting n8n..."
nohup npm exec n8n start -- --host=0.0.0.0 --port=5678 > /tmp/n8n.log 2>&1 &
echo "n8n started in background, logs at /tmp/n8n.log"
exec /lambda-entrypoint.sh "$@"