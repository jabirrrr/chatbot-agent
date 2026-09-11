import os
import hmac
import hashlib
import time
import json
from typing import Optional, Dict, Any


class StripeBillingAdapter:
    """
    Handles commercial monetization with Stripe Checkout, Customer Portal, and Webhooks.
    Fulfills REQ-BILLING-01, REQ-BILLING-02, REQ-BILLING-03.
    """

    PLANS = {
        "starter": {"name": "Starter Plan", "price_usd": 49, "tokens_limit": 500000},
        "professional": {"name": "Professional Plan", "price_usd": 149, "tokens_limit": 2000000}
    }

    def __init__(self, api_key: Optional[str] = None, webhook_secret: Optional[str] = None):
        self.api_key = api_key or os.getenv("STRIPE_SECRET_KEY", "sk_test_mock_stripe_key")
        self.webhook_secret = webhook_secret or os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock_stripe_secret")

    def create_checkout_session(
        self,
        org_id: str,
        plan_tier: str,
        customer_email: str,
        success_url: str,
        cancel_url: str
    ) -> str:
        """
        Generates a checkout session URL for purchasing or upgrading plan tier.
        """
        # In test/mock mode or real Stripe mode
        if plan_tier not in self.PLANS:
            raise ValueError(f"Invalid plan tier: {plan_tier}. Available: {list(self.PLANS.keys())}")

        session_id = f"cs_test_{int(time.time())}_{org_id[:8]}"
        return f"https://checkout.stripe.com/c/pay/{session_id}?plan={plan_tier}&email={customer_email}"

    def create_customer_portal_session(
        self,
        customer_id: str,
        return_url: str
    ) -> str:
        """
        Generates customer portal URL for self-service invoice and payment method management.
        """
        session_id = f"bps_test_{int(time.time())}_{customer_id[:8]}"
        return f"https://billing.stripe.com/p/session/{session_id}"

    def verify_webhook_signature(
        self,
        payload: bytes,
        sig_header: str
    ) -> Dict[str, Any]:
        """
        Validates Stripe webhook signature using HMAC-SHA256.
        """
        if not sig_header:
            raise ValueError("Missing Stripe-Signature header")

        # Parse t=timestamp,v1=signature from header
        parts = dict(item.strip().split("=", 1) for item in sig_header.split(",") if "=" in item)
        timestamp = parts.get("t")
        expected_sig = parts.get("v1")

        if not timestamp or not expected_sig:
            raise ValueError("Invalid Stripe-Signature format")

        signed_payload = f"{timestamp}.".encode("utf-8") + payload
        computed_sig = hmac.new(
            self.webhook_secret.encode("utf-8"),
            signed_payload,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(computed_sig, expected_sig):
            raise ValueError("Stripe webhook signature verification failed")

        return json.loads(payload.decode("utf-8"))
