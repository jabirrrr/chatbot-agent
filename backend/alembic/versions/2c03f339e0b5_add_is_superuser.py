"""add is_superuser

Revision ID: 2c03f339e0b5
Revises: 008_public_launch_and_scaling
Create Date: 2026-09-21 15:51:42.625329

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '2c03f339e0b5'
down_revision: Union[str, None] = '008_public_launch_and_scaling'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), server_default=sa.text('false'), nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'is_superuser')
