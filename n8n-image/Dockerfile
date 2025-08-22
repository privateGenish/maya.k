FROM public.ecr.aws/lambda/nodejs:20

# Install build dependencies
RUN dnf install -y cmake gcc-c++ make python3

# Copy package.json first for better caching
COPY package.json ${LAMBDA_TASK_ROOT}

# Install dependencies
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm install --production

# Set environment variables for n8n
ENV N8N_USER_FOLDER=/tmp/.n8n
ENV N8N_DISABLE_UI=true
ENV N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN=true
ENV NODE_ENV=production

# Create directories
RUN mkdir -p /tmp/.n8n/workflows

# Copy Lambda handler and workflow
COPY handler.js ${LAMBDA_TASK_ROOT}
COPY echo-workflow.json /tmp/.n8n/workflows/
COPY startup.js ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD [ "handler.lambdaHandler" ]