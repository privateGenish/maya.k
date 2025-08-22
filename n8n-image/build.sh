#!/bin/bash

# Build script for n8n Lambda container
set -e

echo "Building n8n Lambda container image..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Build the Docker image for Lambda
docker build -t maya-n8n-lambda:latest "$DIR"

echo "n8n Lambda container image built successfully!"
echo ""
echo "To test locally:"
echo "  docker run -p 9000:8080 maya-n8n-lambda:latest"
echo ""
echo "To test the function:"
echo "  curl -XPOST \"http://localhost:9000/2015-03-31/functions/function/invocations\" -d '{\"prompt\":\"Hello from Lambda!\"}'"
echo ""
echo "For AWS deployment, tag and push to ECR:"
echo "  docker tag maya-n8n-lambda:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/maya-n8n-lambda:latest"
echo "  docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/maya-n8n-lambda:latest"