# Maya.io

A serverless application platform combining AWS SAM with n8n workflow automation, providing both traditional Lambda functions and containerized n8n workflows.

## Project Structure

```
├── functions/              # AWS Lambda functions
│   ├── SNS/               # SNS handler
│   ├── layers/            # Lambda layers
│   └── response/          # Response handlers
├── n8n-image/             # n8n Lambda container
│   ├── Dockerfile         # Lambda container configuration
│   ├── handler.js         # Lambda handler for n8n workflows
│   ├── echo-workflow.json # Sample echo workflow
│   └── build.sh          # Container build script
├── events/                # Test events for local invocation
├── tests/                 # Unit and integration tests
└── template.yaml          # SAM infrastructure template
```

## Components

### Traditional Lambda Functions
- **WhatsApp Integration**: SNS handlers and response functions for WhatsApp messaging
- **Layer Support**: Shared libraries and utilities via Lambda layers

### n8n Container Service
- **Containerized n8n**: Runs n8n workflows in AWS Lambda containers
- **Echo Workflow**: Simple workflow that echoes input prompts
- **Serverless Execution**: On-demand workflow execution without persistent infrastructure

## Quick Start

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Docker installed
- Python 3.13
- Node.js 18+

### Deploy Traditional Functions

```bash
# Build and deploy SAM application
sam build --use-container
sam deploy --guided
```

### Build n8n Container

```bash
# Build n8n Lambda container
cd n8n-image
./build.sh
```

### Local Testing

```bash
# Test SAM functions locally
sam local start-api
curl http://localhost:3000/hello

# Test n8n container locally
cd n8n-image
docker run -p 9000:8080 maya-n8n-lambda:latest

# Test n8n workflow
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"prompt":"Hello from n8n!"}'
```

## Development

### Running Tests

```bash
# Install test dependencies
pip install -r tests/requirements.txt --user

# Run unit tests
python -m pytest tests/unit -v

# Run integration tests (requires deployed stack)
AWS_SAM_STACK_NAME="maya.io" python -m pytest tests/integration -v
```

### Monitoring

```bash
# Tail Lambda logs
sam logs -n HelloWorldFunction --stack-name "maya.io" --tail
```

## n8n Workflows

The n8n container includes:
- **Echo Workflow**: Demonstrates basic prompt processing
- **Lambda Handler**: Processes events and executes workflows
- **Containerized Runtime**: Runs n8n in AWS Lambda environment

### Adding Custom Workflows

1. Create workflow JSON in `n8n-image/`
2. Update `handler.js` to reference new workflow
3. Rebuild container with `./build.sh`

## Deployment

### Container Deployment

```bash
# Tag for ECR
docker tag maya-n8n-lambda:latest <account>.dkr.ecr.<region>.amazonaws.com/maya-n8n-lambda:latest

# Push to ECR
docker push <account>.dkr.ecr.<region>.amazonaws.com/maya-n8n-lambda:latest

# Deploy via SAM or direct Lambda configuration
```

## Cleanup

```bash
# Remove SAM stack
sam delete --stack-name "maya.io"
```

## Architecture

- **API Gateway**: RESTful endpoints for traditional functions
- **Lambda Functions**: Event-driven serverless compute
- **Lambda Containers**: Containerized n8n workflow execution
- **Lambda Layers**: Shared code and dependencies
- **SNS Integration**: Asynchronous messaging support