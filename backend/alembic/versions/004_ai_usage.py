"""Add ai_usage_records table for per-tenant token and cost accounting

Revision ID: 004_ai_usage
Revises: 003_conversations_and_leads
Create Date: 2026-09-12 00:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '004_ai_usage'
down_revision: Union[str, None] = '003_conversations_and_leads'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ai_usage_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('conversations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False, server_default='openrouter'),
        sa.Column('model', sa.String(length=100), nullable=False, server_default='anthropic/claude-sonnet-5'),
        sa.Column('prompt_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completion_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estimated_cost_usd', sa.Numeric(precision=10, scale=6), nullable=False, server_default='0.000000'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_ai_usage_records_organization_id', 'ai_usage_records', ['organization_id'])
    op.create_index('ix_ai_usage_records_conversation_id', 'ai_usage_records', ['conversation_id'])
    op.create_index('ix_ai_usage_records_model', 'ai_usage_records', ['model'])
    op.create_index('ix_ai_usage_records_created_at', 'ai_usage_records', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_ai_usage_records_created_at', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_model', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_conversation_id', table_name='ai_usage_records')
    op.drop_index('ix_ai_usage_records_organization_id', table_name='ai_usage_records')
    op.drop_table('ai_usage_records')
