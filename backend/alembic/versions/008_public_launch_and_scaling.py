"""Add onboarding_checklists table for Milestone M9 public launch and scaling

Revision ID: 008_public_launch_and_scaling
Revises: 007_beta_pilot_tracking
Create Date: 2026-09-12 01:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '008_public_launch_and_scaling'
down_revision: Union[str, None] = '007_beta_pilot_tracking'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Onboarding checklists table
    op.create_table(
        'onboarding_checklists',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('account_created', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('chatbot_configured', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('knowledge_uploaded', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('appearance_customized', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('widget_installed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('calendar_connected', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('first_test_chat', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_onboarding_checklists_organization_id', 'onboarding_checklists', ['organization_id'], unique=True)


def downgrade() -> None:
    op.drop_table('onboarding_checklists')
