class WAWrapper:
    """Simple WhatsApp message type detector"""
    
    def __init__(self, webhook_payload):
        """
        Initialize with WhatsApp webhook payload
        
        Args:
            webhook_payload (dict): The webhook JSON payload from WhatsApp
        """
        self.payload = webhook_payload
    
    def is_valid_webhook(self):
        """Check if payload is a valid WhatsApp webhook"""
        return (
            isinstance(self.payload, dict) and
            self.payload.get('object') == 'whatsapp_business_account' and
            'entry' in self.payload
        )
    
    def get_message_type(self):
        """
        Detect the type of WhatsApp message
        
        Returns:
            str: Message type ('text', 'image', 'contact', 'location', 'reaction', 'sticker', 'unknown')
        """
        if not self.is_valid_webhook():
            return 'invalid'
        
        try:
            # Navigate through the webhook structure
            entry = self.payload['entry'][0]
            changes = entry['changes'][0]
            value = changes['value']
            
            if 'messages' not in value:
                return 'no_messages'
            
            message = value['messages'][0]
            message_type = message.get('type', 'unknown')
            
            # Map WhatsApp types to our simplified types
            type_mapping = {
                'text': 'text',
                'image': 'image',
                'video': 'video', 
                'audio': 'audio',
                'document': 'document',
                'contacts': 'contact',
                'location': 'location',
                'reaction': 'reaction',
                'sticker': 'sticker',
                'interactive': 'quick_reply'
            }
            
            return type_mapping.get(message_type, 'unknown')
            
        except (KeyError, IndexError, TypeError):
            return 'malformed'
    
    def get_sender_info(self):
        """
        Extract basic sender information
        
        Returns:
            dict: Sender info with phone and name if available
        """
        if not self.is_valid_webhook():
            return None
        
        try:
            entry = self.payload['entry'][0]
            changes = entry['changes'][0]
            value = changes['value']
            
            sender_info = {}
            
            # Get message sender
            if 'messages' in value:
                message = value['messages'][0]
                sender_info['phone'] = message.get('from')
            
            # Get contact profile name
            if 'contacts' in value:
                contact = value['contacts'][0]
                profile = contact.get('profile', {})
                sender_info['name'] = profile.get('name')
                sender_info['wa_id'] = contact.get('wa_id')
            
            return sender_info
            
        except (KeyError, IndexError, TypeError):
            return None
    
    def get_message_content(self):
        """
        Extract message content based on message type
        
        Returns:
            dict: Message content with type-specific data
        """
        if not self.is_valid_webhook():
            return None
        
        try:
            entry = self.payload['entry'][0]
            changes = entry['changes'][0]
            value = changes['value']
            
            if 'messages' not in value:
                return None
            
            message = value['messages'][0]
            message_type = message.get('type', 'unknown')
            
            content = {
                'type': message_type,
                'id': message.get('id'),
                'timestamp': message.get('timestamp'),
                'from': message.get('from')
            }
            
            # Extract type-specific content
            if message_type == 'text':
                text_data = message.get('text', {})
                content['body'] = text_data.get('body')
                
            elif message_type in ['image', 'video', 'audio', 'document']:
                media_data = message.get(message_type, {})
                content['media_id'] = media_data.get('id')
                content['mime_type'] = media_data.get('mime_type')
                content['sha256'] = media_data.get('sha256')
                content['caption'] = media_data.get('caption')
                
            elif message_type == 'sticker':
                sticker_data = message.get('sticker', {})
                content['media_id'] = sticker_data.get('id')
                content['mime_type'] = sticker_data.get('mime_type')
                content['sha256'] = sticker_data.get('sha256')
                
            elif message_type == 'location':
                location_data = message.get('location', {})
                content['latitude'] = location_data.get('latitude')
                content['longitude'] = location_data.get('longitude')
                content['name'] = location_data.get('name')
                content['address'] = location_data.get('address')
                
            elif message_type == 'contacts':
                contacts_data = message.get('contacts', [])
                content['contacts'] = contacts_data
                
            elif message_type == 'reaction':
                reaction_data = message.get('reaction', {})
                content['emoji'] = reaction_data.get('emoji')
                content['message_id'] = reaction_data.get('message_id')
                
            elif message_type == 'button':
                button_data = message.get('button', {})
                content['text'] = button_data.get('text')
                content['payload'] = button_data.get('payload')
                content['context'] = message.get('context', {})
                
            elif message_type == 'unknown':
                content['errors'] = message.get('errors', [])
            
            return content
            
        except (KeyError, IndexError, TypeError):
            return None
    
    def get_phone_number_id(self):
        """
        Extract the business phone number ID from webhook metadata
        
        Returns:
            str: Phone number ID or None if not found
        """
        if not self.is_valid_webhook():
            return None
        
        try:
            entry = self.payload['entry'][0]
            changes = entry['changes'][0]
            value = changes['value']
            metadata = value.get('metadata', {})
            
            return metadata.get('phone_number_id')
            
        except (KeyError, IndexError, TypeError):
            return None