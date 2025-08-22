import json
import boto3
import os


def lambda_handler(event, context):  # pylint: disable=unused-argument
    """Webhook Lambda function
    
    Parameters
    ----------
    event: dict, required
        API Gateway Lambda Proxy Input Format
    
    context: object, required
        Lambda Context runtime methods and attributes
    
    Returns
    -------
    API Gateway Lambda Proxy Output Format: dict
    """
    
    http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
    
    # Handle GET request with hub.challenge for webhook verification
    if http_method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        hub_challenge = query_params.get('hub.challenge')
        
        if hub_challenge:
            return {
                "statusCode": 200,
                "body": hub_challenge
            }
    
    # Handle POST request - publish to SNS
    elif http_method == 'POST':
        try:
            # Get the webhook payload from the request body
            webhook_payload = event.get('body')
            if isinstance(webhook_payload, str):
                webhook_payload = json.loads(webhook_payload)
            
            # Publish entire payload to SNS topic
            sns_client = boto3.client('sns')
            topic_arn = os.environ.get('SNS_TOPIC_ARN')
            
            if topic_arn:
                sns_client.publish(
                    TopicArn=topic_arn,
                    Message=json.dumps(webhook_payload),
                    Subject='WhatsApp Webhook Notification'
                )
                
                return {
                    "statusCode": 200,
                    "body": json.dumps({
                        "message": "Webhook received and published to SNS"
                    })
                }
            else:
                return {
                    "statusCode": 500,
                    "body": json.dumps({
                        "message": "SNS_TOPIC_ARN not configured"
                    })
                }
                
        except Exception as e:
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "message": f"Error processing webhook: {str(e)}"
                })
            }
    
    # Default response for other methods
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "OK"
        })
    }