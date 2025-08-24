#!/bin/sh
npm exec n8n import:workflow -- --input=/tmp/echo.json
npm exec n8n update:workflow -- --id=echo --active=true

# Start the n8n server in the background
npm exec n8n start &

# Give n8n a few seconds to start up
sleep 10

# Now, we start the Lambda Runtime Interface Client (RIC)
# This is the crucial step that hands over control to the Lambda runtime
exec /usr/bin/aws-lambda-rie /var/task/lambda_handler.handler