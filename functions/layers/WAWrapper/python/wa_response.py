import urllib3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class WAResponse:
    """WhatsApp Business API response handler for sending messages"""
    
    def __init__(self, access_token, phone_number_id, api_version="v19.0"):
        """
        Initialize WhatsApp response handler
        
        Args:
            access_token (str): WhatsApp Business API access token
            phone_number_id (str): WhatsApp Business phone number ID
            api_version (str): Graph API version (default: v19.0)
        """
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.api_version = api_version
        self.base_url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
        
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
    
    def send_text_message(self, to_phone_number, message_text, preview_url=False):
        """
        Send a text message to a WhatsApp user
        
        Args:
            to_phone_number (str): Recipient's WhatsApp phone number
            message_text (str): Text message to send
            preview_url (bool): Enable link preview (default: False)
            
        Returns:
            dict: API response or error information
        """
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone_number,
            "type": "text",
            "text": {
                "preview_url": preview_url,
                "body": message_text
            }
        }
        
        try:
            logger.info(f"Sending text message to {to_phone_number}")
            
            http = urllib3.PoolManager()
            response = http.request(
                'POST',
                self.base_url,
                headers=self.headers,
                body=json.dumps(payload),
                timeout=30
            )
            
            response_data = json.loads(response.data.decode('utf-8'))
            
            if response.status == 200:
                logger.info(f"Message sent successfully: {response_data}")
                return {
                    'success': True,
                    'message_id': response_data.get('messages', [{}])[0].get('id'),
                    'response': response_data
                }
            else:
                logger.error(f"Failed to send message: {response.status} - {response_data}")
                return {
                    'success': False,
                    'error': response_data,
                    'status_code': response.status
                }
                
        except urllib3.exceptions.HTTPError as e:
            logger.error(f"Request error sending message: {str(e)}")
            return {
                'success': False,
                'error': f"Request failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending message: {str(e)}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}"
            }
    
    def send_reply_message(self, to_phone_number, message_text, reply_to_message_id, preview_url=False):
        """
        Send a text message as a reply to another message
        
        Args:
            to_phone_number (str): Recipient's WhatsApp phone number
            message_text (str): Text message to send
            reply_to_message_id (str): ID of message being replied to
            preview_url (bool): Enable link preview (default: False)
            
        Returns:
            dict: API response or error information
        """
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_phone_number,
            "type": "text",
            "context": {
                "message_id": reply_to_message_id
            },
            "text": {
                "preview_url": preview_url,
                "body": message_text
            }
        }
        
        try:
            logger.info(f"Sending reply message to {to_phone_number} in response to {reply_to_message_id}")
            
            http = urllib3.PoolManager()
            response = http.request(
                'POST',
                self.base_url,
                headers=self.headers,
                body=json.dumps(payload),
                timeout=30
            )
            
            response_data = json.loads(response.data.decode('utf-8'))
            
            if response.status == 200:
                logger.info(f"Reply message sent successfully: {response_data}")
                return {
                    'success': True,
                    'message_id': response_data.get('messages', [{}])[0].get('id'),
                    'response': response_data
                }
            else:
                logger.error(f"Failed to send reply message: {response.status} - {response_data}")
                return {
                    'success': False,
                    'error': response_data,
                    'status_code': response.status
                }
                
        except urllib3.exceptions.HTTPError as e:
            logger.error(f"Request error sending reply message: {str(e)}")
            return {
                'success': False,
                'error': f"Request failed: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error sending reply message: {str(e)}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}"
            }