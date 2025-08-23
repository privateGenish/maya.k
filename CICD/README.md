# CI/CD Pipeline for maya.io

This directory contains the AWS CodePipeline infrastructure for automated building and deployment of the maya.io application.

## Architecture

The pipeline consists of:

- **Source Stage**: Monitors the GitHub repository for changes
- **Build Stage**: Uses AWS CodeBuild to build Docker images and deploy Lambda functions
- **Deploy Stage**: Deploys the application using AWS CodePipeline

## Smart Build Detection

The pipeline includes intelligent build detection for the `n8n-image/` directory:

### How it works:
1. **Hash Calculation**: Calculates MD5 hash of all files in `n8n-image/` directory
2. **Comparison**: Compares current hash with previously stored hash from S3
3. **Decision**: Only builds Docker image if content has changed

### Build Logic:
- **First build**: Always builds (no previous hash exists)
- **Content changed**: Builds when hash differs from previous build
- **No changes**: Skips Docker build, reuses existing image

### Storage:
- Hash is stored in S3 bucket: `{stack-name}-pipeline-artifacts/n8n-image-hash.txt`
- Only updated after successful Docker build and push

## Files

- `template.yaml`: Main CloudFormation/SAM template defining the entire pipeline
- Contains resources for:
  - CodePipeline with Source, Build, and Deploy stages
  - CodeBuild projects for building Docker images
  - IAM roles and permissions
  - S3 bucket for artifacts
  - ECR repository for Docker images

## Environment Variables

Key variables used in the build process:
- `SHOULD_BUILD`: Determines if Docker build is needed (true/false)
- `CURRENT_HASH`: Hash of current n8n-image directory contents  
- `BUCKET_NAME`: S3 bucket name for storing artifacts and hashes
- `IMAGE_TAG`: Docker image tag based on commit SHA
- `IMAGE_URI`: Full ECR URI for the Docker image

## Debugging

The pipeline includes debug output showing:
- Current and previous hashes
- Build decision reasoning
- Variable values in each phase

Check CodeBuild logs for detailed execution information.