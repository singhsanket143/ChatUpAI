"""index chatup_threads user_id

Revision ID: 46b9b5895378
Revises: c655e9035ff2
Create Date: 2026-11-24 21:10:39.901920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46b9b5895378'
down_revision: Union[str, Sequence[str], None] = 'c655e9035ff2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        "ix_chatup_threads_user_id",
        "chatup_threads",
        ["user_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_chatup_threads_user_id", table_name="chatup_threads")
