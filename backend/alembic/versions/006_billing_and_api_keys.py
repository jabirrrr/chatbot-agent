"""Add subscriptions, processed_webhook_events, api_keys, and webhook_endpoints tables

Revision ID: 006_billing_and_api_keys
Revises: 005_appointments_and_integrations
Create Date: 2026-09-12 00:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '006_billing_and_api_keys'
down_revision: Union[str, None] = '005_appointments_and_integrations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(length=255), nullable=True),
        sa.Column('plan_tier', sa.String(length=50), nullable=False, server_default='free'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_subscriptions_organization_id', 'subscriptions', ['organization_id'])
    op.create_index('ix_subscriptions_stripe_customer_id', 'subscriptions', ['stripe_customer_id'])
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'])

    # 2. Processed Webhook Events table
    op.create_table(
        'processed_webhook_events',
        sa.Column('event_id', sa.String(length=255), primary_key=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 3. API Keys table
    op.create_table(
        'api_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('prefix', sa.String(length=16), nullable=False),
        sa.Column('hashed_key', sa.String(length=255), nullable=False),
        sa.Column('scopes', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_api_keys_organization_id', 'api_keys', ['organization_id'])
    op.create_index('ix_api_keys_hashed_key', 'api_keys', ['hashed_key'], unique=True)

    # 4. Webhook Endpoints table
    op.create_table(
        'webhook_endpoints',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('url', sa.String(length=512), nullable=False),
        sa.Column('secret', sa.String(length=255), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_webhook_endpoints_organization_id', 'webhook_endpoints', ['organization_id'])


def downgrade() -> None:
    op.drop_index('ix_webhook_endpoints_organization_id', table_name='webhook_endpoints')
    op.drop_table('webhook_endpoints')

    op.drop_index('ix_api_keys_hashed_key', table_name='api_keys')
    op.drop_index('ix_api_keys_organization_id', table_name='api_keys')
    op.drop_table('api_keys')

    op.drop_table('processed_webhook_events')

    op.drop_index('ix_subscriptions_stripe_subscription_id', table_name='subscriptions')
    op.drop_index('ix_subscriptions_stripe_customer_id', table_name='subscriptions')
    op.drop_index('ix_subscriptions_organization_id', table_name='subscriptions')
    op.drop_table('subscriptions')
