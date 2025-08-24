FROM public.ecr.aws/lambda/nodejs:20

# Copy package.json first for better caching
COPY package.json ${LAMBDA_TASK_ROOT}

# Install dependencies and sqlite3
WORKDIR ${LAMBDA_TASK_ROOT}
RUN npm install --production && \
    microdnf update -y && \
    microdnf install -y sqlite && \
    microdnf clean all

# Set environment variables for n8n
ENV N8N_USER_FOLDER=/tmp/.n8n
ENV N8N_DISABLE_UI=false
ENV NODE_ENV=production
ENV DB_SQLITE_POOL_SIZE=1


# Create directories
RUN mkdir -p /tmp/.n8n

# Copy files
COPY handler.js ${LAMBDA_TASK_ROOT}
COPY echo-workflow.json ${LAMBDA_TASK_ROOT}

# Set the CMD to the handler
CMD [ "handler.lambdaHandler" ]