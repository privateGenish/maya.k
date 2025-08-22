#!/bin/bash

# Script to update AWS Secrets Manager with tokens from tokens.env
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

print_info() {
    echo -e "${YELLOW}INFO: $1${NC}"
}

# Check if tokens.env file exists
if [ ! -f "tokens.env" ]; then
    print_error "tokens.env file not found in current directory"
    exit 1
fi

print_info "Reading tokens.env file..."

# Source the tokens.env file to load environment variables
if ! source tokens.env; then
    print_error "Failed to source tokens.env file"
    exit 1
fi

# Check if WA_TOKEN_SECRET is set and not empty
if [ -z "$WA_TOKEN_SECRET" ]; then
    print_error "WA_TOKEN_SECRET not found or empty in tokens.env"
    exit 1
fi

print_info "Found WA_TOKEN_SECRET in tokens.env"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS CLI is not configured or lacks permissions. Run 'aws configure' first."
    exit 1
fi

print_info "AWS CLI is configured and ready"

# Update the secret in AWS Secrets Manager
print_info "Updating maya-wa-token secret in AWS Secrets Manager..."

if aws secretsmanager update-secret \
    --secret-id "maya-wa-token" \
    --secret-string "$WA_TOKEN_SECRET" \
    --output table; then
    print_success "Successfully updated maya-wa-token secret"
else
    print_error "Failed to update maya-wa-token secret"
    print_info "Make sure the secret exists and you have the necessary permissions"
    exit 1
fi

print_success "Script completed successfully!"