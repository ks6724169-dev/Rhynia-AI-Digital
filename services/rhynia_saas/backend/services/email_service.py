"""
Rhynia Intelligence SaaS — Email Service (Gmail SMTP SSL)
Dispatches verification codes, password resets, and notifications to Gmail inboxes.
"""

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

from services.rhynia_saas.backend.config import settings

logger = logging.getLogger("rhynia.email")


class EmailService:
    """Service to send emails via Gmail SMTP SSL."""

    def __init__(self):
        self.smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = getattr(settings, "SMTP_PORT", 465)
        self.smtp_user = getattr(settings, "SMTP_USER", "mk6611236@gmail.com")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "nldgbrmonepawpqw")
        self.from_name = getattr(settings, "SMTP_FROM_NAME", "Rhynia Intelligence")

    def is_configured(self) -> bool:
        """Check if SMTP credentials are provided."""
        return bool(self.smtp_user and self.smtp_password)

    def _send_sync(self, to_email: str, subject: str, html_content: str, text_content: str) -> Dict[str, Any]:
        """Synchronous SMTP transmission using SSL."""
        if not self.is_configured():
            logger.warning("[EMAIL SERVICE] SMTP not configured. Running in mock dev mode.")
            return {"success": True, "mock": True, "message": "SMTP not configured"}

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.from_name} <{self.smtp_user}>"
        msg["To"] = to_email

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        try:
            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=15) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, [to_email], msg.as_string())
            logger.info(f"[EMAIL SERVICE] Successfully sent email to {to_email}")
            return {"success": True, "message": f"Email delivered to {to_email}"}
        except Exception as e:
            logger.error(f"[EMAIL SERVICE] Failed to send email to {to_email}: {e}")
            return {"success": False, "error": str(e)}

    async def send_otp_email(self, to_email: str, otp_code: str, user_name: Optional[str] = None) -> Dict[str, Any]:
        """Send a branded 6-digit OTP code to a user's Gmail address."""
        subject = f"{otp_code} is your Rhynia verification code"
        name = user_name or "User"

        text_content = f"Hello {name},\n\nYour Rhynia verification code is: {otp_code}\n\nThis code will expire in 5 minutes. Do not share it with anyone.\n\nRhynia Intelligence"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code</title>
</head>
<body style="margin:0; padding:0; background-color:#0a0a0a; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a; padding:40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:500px; background-color:#141414; border-radius:16px; border:1px solid #262626; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 20px 32px; text-align:center; border-bottom:1px solid #1f1f1f;">
              <h1 style="margin:0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">Rhynia <span style="color:#0078D4;">Intelligence</span></h1>
              <p style="margin:6px 0 0 0; font-size:12px; color:#888888; text-transform:uppercase; letter-spacing:1.5px;">Account Security</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px 0; font-size:15px; color:#d4d4d4; line-height:1.5;">Hello {name},</p>
              <p style="margin:0 0 24px 0; font-size:14px; color:#a3a3a3; line-height:1.5;">Use the verification code below to complete your sign in or password reset:</p>
              
              <!-- Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="background-color:#1c1c1c; border:1px solid #0078D4; border-radius:12px; padding:20px;">
                    <span style="font-family:'Courier New',Courier,monospace; font-size:36px; font-weight:700; letter-spacing:8px; color:#4cc2ff; display:inline-block;">{otp_code}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0; font-size:12px; color:#737373; line-height:1.6; text-align:center;">
                This code is valid for <strong>5 minutes</strong>. For your security, never share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:#0f0f0f; border-top:1px solid #1f1f1f; text-align:center;">
              <p style="margin:0; font-size:11px; color:#525252;">&copy; 2026 Rhynia Intelligence. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
        return await asyncio.to_thread(self._send_sync, to_email, subject, html_content, text_content)


email_service = EmailService()
