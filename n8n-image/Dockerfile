FROM public.ecr.aws/lambda/nodejs:22

# Install n8n globally
RUN npm install -g n8n

# Create n8n data directory
RUN mkdir -p /tmp/.n8n

# Set environment variables for Lambda
ENV N8N_USER_FOLDER=/tmp/.n8n
ENV N8N_DISABLE_UI=true
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false
ENV N8N_RUNNERS_ENABLED=true
ENV DB_SQLITE_POOL_SIZE=1
ENV N8N_HOST=0.0.0.0
ENV N8N_PORT=5678
ENV N8N_PROTOCOL=http
ENV N8N_LOG_LEVEL=debug
ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first --ipv6-disable"

# Copy the workflow files and script
COPY echo.json /opt/echo.json
COPY health.json /opt/health.json
COPY init.sh /opt/init.sh
RUN chmod +x /opt/init.sh

# Copy the handler file
COPY lambda_handler.js /var/task/lambda_handler.js

ENTRYPOINT [ "/opt/init.sh" ]

# Set the Lambda handler directly
CMD ["lambda_handler.handler"]