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
ENV N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false

# Copy the workflow file and script
COPY echo.json /opt/echo.json
COPY init.sh /opt/init.sh
RUN chmod +x /opt/init.sh

# Copy the handler file
COPY lambda_handler.js /var/task/lambda_handler.js

ENTRYPOINT [ "/opt/init.sh" ]

# Set the Lambda handler directly
CMD ["lambda_handler.handler"]