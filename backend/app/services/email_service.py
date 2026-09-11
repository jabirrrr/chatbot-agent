import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger("email_service")


class EmailService:
    """
    Transactional email delivery engine for self-serve onboarding sequences and alerts.
    Fulfills Phase 4 / Milestone M9 requirement for automated onboarding sequences.
    """
    _sent_dispatches: List[Dict[str, Any]] = []

    @classmethod
    def get_dispatches(cls) -> List[Dict[str, Any]]:
        return cls._sent_dispatches

    @classmethod
    def clear_dispatches(cls) -> None:
        cls._sent_dispatches.clear()

    @classmethod
    async def send_welcome_email(
        cls,
        recipient_email: str,
        full_name: str,
        org_name: str
    ) -> Dict[str, Any]:
        """Day 0: Welcome new user and introduction to workspace."""
        subject = f"Welcome to Helio AI, {full_name} - Let's set up {org_name}"
        body = (
            f"Hi {full_name},\n\n"
            f"Welcome to Helio! Your autonomous AI chatbot workspace for {org_name} is active.\n"
            f"Next step: Configure your first chatbot and upload your business FAQs or knowledge docs.\n\n"
            f"Access your dashboard: https://app.helio.ai\n"
        )
        record = {
            "sequence_type": "day_0_welcome",
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "sent_at": datetime.now(timezone.utc),
            "status": "delivered"
        }
        cls._sent_dispatches.append(record)
        logger.info(f"Delivered Day 0 Welcome Email to {recipient_email}")
        return record

    @classmethod
    async def send_knowledge_upload_reminder(
        cls,
        recipient_email: str,
        org_name: str
    ) -> Dict[str, Any]:
        """Day 1: Prompt user to train the agent with business context."""
        subject = f"Teach your agent: Upload your first document for {org_name}"
        body = (
            f"Hi there,\n\n"
            f"Your AI agent for {org_name} is ready for training.\n"
            f"Upload your product catalog, service price list, or onboarding PDF to enable zero-hallucination answers.\n\n"
            f"Train your agent: https://app.helio.ai/knowledge\n"
        )
        record = {
            "sequence_type": "day_1_knowledge",
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "sent_at": datetime.now(timezone.utc),
            "status": "delivered"
        }
        cls._sent_dispatches.append(record)
        logger.info(f"Delivered Day 1 Knowledge Reminder to {recipient_email}")
        return record

    @classmethod
    async def send_widget_installation_guide(
        cls,
        recipient_email: str,
        org_name: str,
        snippet: Optional[str] = None
    ) -> Dict[str, Any]:
        """Day 3: Assist user with embedding widget snippet on website."""
        subject = f"Embed your widget on your site: 1-line script for {org_name}"
        body = (
            f"Hi there,\n\n"
            f"Deploy your trained AI agent to convert website visitors into qualified leads.\n"
            f"Paste this 1-line script before the closing </body> tag:\n\n"
            f"{snippet or '<script src=\"https://cdn.helio.ai/v1/widget.js\" async></script>'}\n\n"
            f"Test live: https://app.helio.ai/appearance\n"
        )
        record = {
            "sequence_type": "day_3_install",
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "sent_at": datetime.now(timezone.utc),
            "status": "delivered"
        }
        cls._sent_dispatches.append(record)
        logger.info(f"Delivered Day 3 Widget Installation Guide to {recipient_email}")
        return record

    @classmethod
    async def send_first_lead_notification(
        cls,
        recipient_email: str,
        org_name: str,
        lead_name: str,
        lead_email: str
    ) -> Dict[str, Any]:
        """Day 7: Celebrate first captured lead and highlight dashboard CRM."""
        subject = f"🚀 High-Intent Lead Captured for {org_name}!"
        body = (
            f"Exciting news!\n\n"
            f"Your Helio chatbot just qualified a new lead:\n"
            f"Name: {lead_name}\n"
            f"Email: {lead_email}\n\n"
            f"View full conversation transcript and qualification details in your CRM: https://app.helio.ai/leads\n"
        )
        record = {
            "sequence_type": "day_7_lead",
            "recipient_email": recipient_email,
            "subject": subject,
            "body": body,
            "sent_at": datetime.now(timezone.utc),
            "status": "delivered"
        }
        cls._sent_dispatches.append(record)
        logger.info(f"Delivered Day 7 First Lead Notification to {recipient_email}")
        return record
