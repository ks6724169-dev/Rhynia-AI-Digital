"""
Rhynia Intelligence SaaS — Fast2SMS Gateway Integration Service
Dispatches real SMS OTPs to Indian mobile numbers via Fast2SMS API.
"""

import logging
import re
from typing import Dict, Any, Optional
import httpx

from services.rhynia_saas.backend.config import settings

logger = logging.getLogger("rhynia.sms")

FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"


class SMSService:
    """Service to send SMS OTPs via Fast2SMS Gateway."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "FAST2SMS_API_KEY", None)

    def is_configured(self) -> bool:
        """Check if Fast2SMS API key is set."""
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def send_otp(self, phone_number: str, otp_code: str) -> Dict[str, Any]:
        """
        Send a 6-digit OTP to the specified phone number via Fast2SMS.
        Returns a dict with success status, raw response message, and delivery details.
        """
        # Clean phone number to 10-digit Indian mobile number
        clean_number = re.sub(r"[^\d]", "", phone_number)
        if len(clean_number) > 10:
            clean_number = clean_number[-10:]

        if len(clean_number) != 10:
            return {
                "success": False,
                "error": "Invalid phone number. Must be a 10-digit Indian mobile number.",
                "sms_delivered": False,
            }

        if not self.is_configured():
            logger.warning("[SMS SERVICE] Fast2SMS API Key not configured. Running in mock dev mode.")
            return {
                "success": True,
                "mock": True,
                "sms_delivered": False,
                "message": f"Dev mode: OTP {otp_code} logged to console.",
            }

        headers = {
            "authorization": self.api_key.strip(),
            "Content-Type": "application/json",
        }

        # Try Fast2SMS Quick SMS route first
        payload = {
            "route": "q",
            "message": f"Your Rhynia verification code is {otp_code}. Valid for 5 minutes. Do not share with anyone.",
            "language": "english",
            "flash": 0,
            "numbers": clean_number,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(FAST2SMS_URL, json=payload, headers=headers)
                data = resp.json() if resp.text else {}

                if resp.status_code == 200 and data.get("return") is True:
                    logger.info(f"[SMS SERVICE] SMS sent successfully to {clean_number}")
                    return {
                        "success": True,
                        "sms_delivered": True,
                        "message": "SMS sent successfully to your mobile phone.",
                    }

                # Check for Fast2SMS minimum recharge notice (code 999)
                status_code = data.get("status_code")
                msg = data.get("message", "Fast2SMS delivery error")

                logger.warning(f"[SMS SERVICE] Fast2SMS response status={status_code}: {msg}")
                return {
                    "success": False,
                    "status_code": status_code,
                    "sms_delivered": False,
                    "message": msg,
                }

        except Exception as e:
            logger.error(f"[SMS SERVICE] Exception sending SMS via Fast2SMS: {e}")
            return {
                "success": False,
                "sms_delivered": False,
                "error": str(e),
            }


sms_service = SMSService()
