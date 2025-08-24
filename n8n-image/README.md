# n8n Lambda Container Image

A Docker container image that runs n8n (workflow automation tool) on AWS Lambda with a Lambda handler to process events.

## Overview

This container image combines:
- **n8n**: Workflow automation platform running in headless mode
- **Lambda Handler**: Processes AWS Lambda events and forwards them to n8n workflows
- **AWS Lambda Runtime**: Compatible with AWS Lambda container deployment

## Architecture

1. **Container Startup**: n8n initializes and imports workflows
2. **Event Processing**: Lambda handler receives events and waits for n8n to be ready
3. **Workflow Execution**: Events are forwarded to n8n webhook endpoints
4. **Response**: Results are returned to the Lambda caller

## Files

- `Dockerfile`: Multi-stage build with n8n and Lambda runtime
- `lambda_handler.js`: Lambda function handler that interfaces with n8n
- `init.sh`: Initialization script that imports workflows and starts n8n
- `echo.json`: Sample n8n workflow definition

## Build & Run

### Local Build
```bash
docker build -t n8n-lambda .
```

### Local Testing (Lambda Runtime Interface Emulator)
```bash
# Run container
docker run -p 9000:8080 n8n-lambda

# Test with curl
curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{"key1": "value1", "key2": "value2"}'
```

### Environment Variables

- `N8N_USER_FOLDER=/tmp/.n8n` - n8n data directory (Lambda writable)
- `N8N_DISABLE_UI=true` - Headless mode for Lambda
- `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false` - Disable file permission checks
- `N8N_RUNNERS_ENABLED=true` - Enable workflow runners
- `DB_SQLITE_POOL_SIZE=1` - SQLite connection pool size

## Lambda Handler

The `lambda_handler.js` includes:
- Health check to ensure n8n is ready (60-second timeout)
- Event forwarding to n8n webhook endpoints
- Error handling and logging
- Response formatting for Lambda

## Workflow Configuration

Workflows are imported during container initialization via `init.sh`:
```bash
npm exec n8n import:workflow -- --input=/tmp/echo.json
npm exec n8n update:workflow -- --id=echo --active=true
```

## Deployment

This image is designed for AWS Lambda container deployment:
1. Push to Amazon ECR
2. Create Lambda function using container image
3. Configure function timeout and memory as needed

## Limitations

- Cold start latency due to n8n initialization
- Lambda execution time limits apply
- Limited to Lambda's ephemeral storage (/tmp)
- No persistent workflow state between invocations

## Customization

To use different workflows:
1. Replace `echo.json` with your workflow definition
2. Update webhook paths in `lambda_handler.js`
3. Rebuild the container image