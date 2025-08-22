import json
import logging
import boto3
import os
from wa_wrapper import WAWrapper

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):  # pylint: disable=unused-argument
    """SNS notification handler Lambda function
    
    Parameters
    ----------
    event: dict, required
        SNS event containing Records with SNS messages
    
    context: object, required
        Lambda Context runtime methods and attributes
    
    Returns
    -------
    dict: Success response
    """
    
    try:
        sqs_client = boto3.client('sqs')
        queue_url = os.environ.get('SQS_QUEUE_URL')
        
        if not queue_url:
            logger.error("SQS_QUEUE_URL environment variable not set")
            raise ValueError("SQS_QUEUE_URL not configured")
        
        # Process each SNS record
        for record in event.get('Records', []):
            if record.get('EventSource') == 'aws:sns':
                # Extract SNS message
                sns_message = record['Sns']
                message = sns_message.get('Message')
                message_id = sns_message.get('MessageId')
                
                logger.info(f"Processing SNS message ID: {message_id}")
                
                # Parse the webhook payload from SNS message
                try:
                    webhook_payload = json.loads(message)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse webhook payload: {message}")
                    continue
                
                # Use WAWrapper to extract sender information
                wrapper = WAWrapper(webhook_payload)
                if not wrapper.is_valid_webhook():
                    logger.warning("Invalid WhatsApp webhook payload, skipping")
                    continue
                
                sender_info = wrapper.get_sender_info()
                if not sender_info or not sender_info.get('phone'):
                    logger.error("Could not extract sender phone number")
                    continue
                
                message_group_id = sender_info['phone']
                logger.info(f"Sending message to SQS with MessageGroupId: {message_group_id}")
                
                # Send message to FIFO SQS queue
                sqs_client.send_message(
                    QueueUrl=queue_url,
                    MessageBody=json.dumps(webhook_payload),
                    MessageGroupId=message_group_id,
                    MessageDeduplicationId=message_id
                )
                
                logger.info(f"Successfully sent message to SQS queue for sender: {message_group_id}")
                
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'SNS notifications processed successfully',
                'processed_records': len(event.get('Records', []))
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing SNS notification: {str(e)}")
        raise e