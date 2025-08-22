"""
WAWrapper - WhatsApp Webhook Message Wrapper
Simple wrapper for detecting and handling WhatsApp webhook message types and sending responses
"""

from .wa_wrapper import WAWrapper
from .wa_response import WAResponse

__version__ = "1.0.0"
__all__ = ["WAWrapper", "WAResponse"]