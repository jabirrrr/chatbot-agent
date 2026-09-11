"""Add beta_deployments and beta_feedback tables for Milestone M8 closed beta pilot

Revision ID: 007_beta_pilot_tracking
Revises: 006_billing_and_api_keys
Create Date: 2026-09-12 01:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '007_beta_pilot_tracking'
down_revision: Union[str, None] = '006_billing_and_api_keys'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Beta deployments table
    op.create_table(
        'beta_deployments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('industry', sa.String(length=100), nullable=False),
        sa.Column('target_domain', sa.String(length=255), nullable=True),
        sa.Column('is_deployed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('last_ping_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('activation_stage', sa.String(length=50), nullable=False, server_default='registered'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_beta_deployments_organization_id', 'beta_deployments', ['organization_id'])
    op.create_index('ix_beta_deployments_industry', 'beta_deployments', ['industry'])
    op.create_index('ix_beta_deployments_is_deployed', 'beta_deployments', ['is_deployed'])

    # 2. Beta feedback table
    op.create_table(
        'beta_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('nps_score', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='general'),
        sa.Column('feedback_text', sa.Text(), nullable=False),
        sa.Column('feature_request', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_beta_feedback_organization_id', 'beta_feedback', ['organization_id'])
    op.create_index('ix_beta_feedback_user_id', 'beta_feedback', ['user_id'])


def downgrade() -> None:
    op.drop_table('beta_feedback')
    op.drop_table('beta_deployments')
