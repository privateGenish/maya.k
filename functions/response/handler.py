import json
import logging
import boto3
from wa_wrapper import WAWrapper
from wa_response import WAResponse

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_wa_token():
    """Retrieve WhatsApp token from AWS Secrets Manager"""
    try:
        secrets_client = boto3.client('secretsmanager')
        response = secrets_client.get_secret_value(SecretId='maya-wa-token')
        return response['SecretString']
    except Exception as e:
        logger.error(f"Failed to retrieve WA token: {str(e)}")
        return None


def invoke_n8n_lambda(prompt):
    """Invoke N8N Lambda container to process message"""
    try:
        lambda_client = boto3.client('lambda')
        
        payload = {
            'prompt': prompt
        }
        
        response = lambda_client.invoke(
            FunctionName='N8NContainer',
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        response_payload = json.loads(response['Payload'].read())
        
        if response['StatusCode'] == 200 and response_payload.get('statusCode') == 200:
            body = json.loads(response_payload.get('body', '{}'))
            logger.info(f"N8N Lambda response: {body}")
            return body
        else:
            logger.error(f"N8N Lambda error: {response_payload}")
            return {'output': f"Processing error occurred"}
            
    except Exception as e:
        logger.error(f"Failed to invoke N8N Lambda: {str(e)}")
        return {'output': f"You said: {prompt}"}


def lambda_handler(event, context):  # pylint: disable=unused-argument
    """Response Lambda function that processes messages from SQS queue
    
    Parameters
    ----------
    event: dict, required
        SQS event containing Records with SQS messages
    
    context: object, required
        Lambda Context runtime methods and attributes
    
    Returns
    -------
    dict: Success response
    """
    
    try:
        # Process each SQS record
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:sqs':
                # Extract SQS message
                message_body = record.get('body')
                message_id = record.get('messageId')
                
                logger.info(f"Processing SQS message ID: {message_id}")
                
                # Parse message body if it's JSON
                try:
                    webhook_payload = json.loads(message_body)
                    logger.info(f"Processing webhook payload from SQS")
                    
                    # Use WAWrapper to analyze the WhatsApp message
                    wrapper = WAWrapper(webhook_payload)
                    
                    if wrapper.is_valid_webhook():
                        message_type = wrapper.get_message_type()
                        sender_info = wrapper.get_sender_info()
                        message_content = wrapper.get_message_content()
                        
                        logger.info(f"Message Type: {message_type}")
                        logger.info(f"Sender: {sender_info.get('name', 'Unknown')} ({sender_info.get('phone', 'Unknown')})")
                        
                        # Get WA token and setup response handler
                        wa_token = get_wa_token()
                        if not wa_token:
                            logger.error("Cannot send response - WA token not available")
                            continue
                        
                        # Get phone number ID from webhook payload
                        phone_number_id = wrapper.get_phone_number_id()
                        if not phone_number_id:
                            logger.error("Could not extract phone number ID from webhook")
                            continue
                        wa_response = WAResponse(wa_token, phone_number_id)
                        
                        sender_phone = sender_info.get('phone')
                        original_message_id = message_content.get('id')
                        
                        # Handle different message types
                        if message_type == 'text':
                            text_body = message_content.get('body', '')
                            logger.info(f"Text message: {text_body}")
                            
                            # Invoke N8N Lambda container to process the message
                            n8n_response = invoke_n8n_lambda(text_body)
                            response_message = n8n_response.get('output', f"You said: {text_body}")
                            
                            if sender_phone:
                                response_result = wa_response.send_reply_message(
                                    to_phone_number=sender_phone,
                                    message_text=response_message,
                                    reply_to_message_id=original_message_id
                                )
                                
                                if response_result.get('success'):
                                    logger.info(f"Successfully echoed message to {sender_phone}")
                                else:
                                    logger.error(f"Failed to echo message: {response_result.get('error')}")
                            
                        else:
                            # For all other message types, send "not supported" message
                            unsupported_message = f"Message type '{message_type}' is currently not supported."
                            
                            if sender_phone:
                                response_result = wa_response.send_reply_message(
                                    to_phone_number=sender_phone,
                                    message_text=unsupported_message,
                                    reply_to_message_id=original_message_id
                                )
                                
                                if response_result.get('success'):
                                    logger.info(f"Successfully sent unsupported message response to {sender_phone}")
                                else:
                                    logger.error(f"Failed to send unsupported message: {response_result.get('error')}")
                            
                            logger.info(f"Unsupported message type: {message_type}")
                            
                    else:
                        logger.warning("Invalid WhatsApp webhook payload received")
                        
                except json.JSONDecodeError:
                    logger.info(f"Message body (non-JSON): {message_body}")
                
                # Add your additional message processing logic here
                
                logger.info(f"Successfully processed message {message_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'SQS messages processed successfully',
                'processed_records': len(event.get('Records', []))
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing SQS messages: {str(e)}")
        raise e