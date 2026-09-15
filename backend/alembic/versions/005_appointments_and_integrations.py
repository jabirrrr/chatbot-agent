"""Add appointments and tenant_integrations tables

Revision ID: 005_appointments_and_integrations
Revises: 004_ai_usage
Create Date: 2026-09-12 00:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '005_appts_integrations'
down_revision: Union[str, None] = '004_ai_usage'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tenant integrations table
    op.create_table(
        'tenant_integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('encrypted_credentials', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='connected'),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tenant_integrations_organization_id', 'tenant_integrations', ['organization_id'])
    op.create_index('ix_tenant_integrations_provider', 'tenant_integrations', ['provider'])

    # 2. Appointments table
    op.create_table(
        'appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('leads.id', ondelete='SET NULL'), nullable=True),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('attendee_name', sa.String(length=255), nullable=False),
        sa.Column('attendee_email', sa.String(length=255), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='scheduled'),
        sa.Column('meeting_link', sa.String(length=512), nullable=True),
        sa.Column('provider_event_id', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_appointments_organization_id', 'appointments', ['organization_id'])
    op.create_index('ix_appointments_lead_id', 'appointments', ['lead_id'])
    op.create_index('ix_appointments_conversation_id', 'appointments', ['conversation_id'])
    op.create_index('ix_appointments_attendee_email', 'appointments', ['attendee_email'])
    op.create_index('ix_appointments_scheduled_at', 'appointments', ['scheduled_at'])


def downgrade() -> None:
    op.drop_index('ix_appointments_scheduled_at', table_name='appointments')
    op.drop_index('ix_appointments_attendee_email', table_name='appointments')
    op.drop_index('ix_appointments_conversation_id', table_name='appointments')
    op.drop_index('ix_appointments_lead_id', table_name='appointments')
    op.drop_index('ix_appointments_organization_id', table_name='appointments')
    op.drop_table('appointments')

    op.drop_index('ix_tenant_integrations_provider', table_name='tenant_integrations')
    op.drop_index('ix_tenant_integrations_organization_id', table_name='tenant_integrations')
    op.drop_table('tenant_integrations')
