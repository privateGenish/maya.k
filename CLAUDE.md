# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an AWS SAM (Serverless Application Model) project for a Python Lambda function API. The application creates a simple "hello world" API endpoint deployed via AWS API Gateway and Lambda.

## Architecture
- **Lambda Function**: `hello_world/app.py` - Main application handler with Python 3.13 runtime
- **API Gateway**: Configured via `template.yaml` to expose `/hello` GET endpoint
- **Infrastructure as Code**: `template.yaml` defines all AWS resources using SAM syntax
- **Testing**: Separate unit and integration test suites in `tests/` directory

## Development Commands

### Building and Deployment
```bash
# Build the application (uses Docker container for consistent environment)
sam build --use-container

# First deployment (guided setup)
sam deploy --guided

# Subsequent deployments
sam deploy
```

### Local Development and Testing
```bash
# Run API locally on port 3000
sam local start-api

# Test locally with curl
curl http://localhost:3000/hello

# Invoke function directly with test event
sam local invoke HelloWorldFunction --event events/event.json
```

### Running Tests
```bash
# Install test dependencies
pip install -r tests/requirements.txt --user

# Run unit tests
python -m pytest tests/unit -v

# Run integration tests (requires deployed stack)
AWS_SAM_STACK_NAME="maya.io" python -m pytest tests/integration -v
```

### Monitoring and Debugging
```bash
# Tail Lambda function logs (requires deployed stack)
sam logs -n HelloWorldFunction --stack-name "maya.io" --tail
```

### Cleanup
```bash
# Delete deployed stack
sam delete --stack-name "maya.io"
```

## Project Structure
- `hello_world/` - Lambda function code and dependencies
- `events/` - Sample invocation events for local testing
- `tests/unit/` - Unit tests for application logic
- `tests/integration/` - Integration tests requiring deployed resources
- `template.yaml` - SAM template defining infrastructure
- `samconfig.toml` - SAM deployment configuration

## Key Dependencies
- **Runtime**: Python 3.13
- **Application**: `requests` library
- **Testing**: `pytest`, `boto3`, `requests`