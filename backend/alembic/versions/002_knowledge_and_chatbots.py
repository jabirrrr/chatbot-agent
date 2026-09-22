"""Add chatbots, knowledge sources, document chunks with pgvector, and business info

Revision ID: 002_knowledge_and_chatbots
Revises: 001_initial_schema
Create Date: 2026-09-11 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

revision: str = '002_knowledge_and_chatbots'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Chatbots table
    op.create_table(
        'chatbots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('welcome_message', sa.String(length=1024), nullable=False),
        sa.Column('fallback_message', sa.String(length=1024), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False, server_default='anthropic/claude-sonnet-5'),
        sa.Column('temperature', sa.Float(), nullable=False, server_default='0.3'),
        sa.Column('max_tokens', sa.Float(), nullable=False, server_default='1024'),
        sa.Column('widget_token', sa.String(length=128), nullable=False),
        sa.Column('theme_color', sa.String(length=50), nullable=False, server_default='#3b82f6'),
        sa.Column('position', sa.String(length=20), nullable=False, server_default='bottom-right'),
        sa.Column('lead_capture_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('appointment_booking_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_chatbots_organization_id', 'chatbots', ['organization_id'])
    op.create_index('ix_chatbots_widget_token', 'chatbots', ['widget_token'], unique=True)

    # 2. Knowledge Sources table
    op.create_table(
        'knowledge_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False, server_default='text'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=1024), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('char_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('chunk_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('metadata_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_knowledge_sources_organization_id', 'knowledge_sources', ['organization_id'])

    # 3. Document Chunks with Vector(1536) and HNSW Index
    op.create_table(
        'document_chunks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('knowledge_sources.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chatbot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chatbots.id', ondelete='CASCADE'), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('embedding', Vector(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_document_chunks_organization_id', 'document_chunks', ['organization_id'])
    op.create_index('ix_document_chunks_source_id', 'document_chunks', ['source_id'])
    op.create_index('ix_document_chunks_chatbot_id', 'document_chunks', ['chatbot_id'])

    # 4. Business Info table
    op.create_table(
        'business_info',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False, server_default='faq'),
        sa.Column('question', sa.String(length=512), nullable=True),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_business_info_organization_id', 'business_info', ['organization_id'])


def downgrade() -> None:
    op.drop_table('business_info')
    op.drop_table('document_chunks')
    op.drop_table('knowledge_sources')
    op.drop_table('chatbots')
