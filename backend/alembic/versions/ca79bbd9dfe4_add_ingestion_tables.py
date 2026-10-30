"""Add ingestion tables

Revision ID: ca79bbd9dfe4
Revises: 0001_initial_tables
Create Date: 2026-10-29 10:38:15.951204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ca79bbd9dfe4'
down_revision: Union[str, Sequence[str], None] = '0001_initial_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. bank_transactions
    op.create_table(
        'bank_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_id', sa.String(length=100), nullable=False),
        sa.Column('sender_name', sa.String(length=200), nullable=False),
        sa.Column('sender_account', sa.String(length=100), nullable=False),
        sa.Column('receiver_name', sa.String(length=200), nullable=False),
        sa.Column('receiver_account', sa.String(length=100), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=True),
        sa.Column('transaction_type', sa.String(length=50), nullable=True),
        sa.Column('suspicious', sa.Boolean(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.String(length=500), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bank_transactions_id'), 'bank_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_bank_transactions_transaction_id'), 'bank_transactions', ['transaction_id'], unique=True)
    op.create_index(op.f('ix_bank_transactions_sender_account'), 'bank_transactions', ['sender_account'], unique=False)
    op.create_index(op.f('ix_bank_transactions_receiver_account'), 'bank_transactions', ['receiver_account'], unique=False)

    # 2. call_records
    op.create_table(
        'call_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('record_id', sa.String(length=100), nullable=False),
        sa.Column('caller_number', sa.String(length=50), nullable=False),
        sa.Column('caller_name', sa.String(length=200), nullable=True),
        sa.Column('receiver_number', sa.String(length=50), nullable=False),
        sa.Column('receiver_name', sa.String(length=200), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('tower_id', sa.String(length=100), nullable=True),
        sa.Column('location_name', sa.String(length=200), nullable=True),
        sa.Column('call_type', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_call_records_id'), 'call_records', ['id'], unique=False)
    op.create_index(op.f('ix_call_records_record_id'), 'call_records', ['record_id'], unique=True)
    op.create_index(op.f('ix_call_records_caller_number'), 'call_records', ['caller_number'], unique=False)
    op.create_index(op.f('ix_call_records_receiver_number'), 'call_records', ['receiver_number'], unique=False)

    # 3. vehicle_sightings
    op.create_table(
        'vehicle_sightings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sighting_id', sa.String(length=100), nullable=False),
        sa.Column('plate_number', sa.String(length=50), nullable=False),
        sa.Column('vehicle_model', sa.String(length=100), nullable=True),
        sa.Column('owner_name', sa.String(length=200), nullable=True),
        sa.Column('camera_id', sa.String(length=100), nullable=False),
        sa.Column('location_name', sa.String(length=200), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('speed_kmh', sa.Float(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_vehicle_sightings_id'), 'vehicle_sightings', ['id'], unique=False)
    op.create_index(op.f('ix_vehicle_sightings_sighting_id'), 'vehicle_sightings', ['sighting_id'], unique=True)
    op.create_index(op.f('ix_vehicle_sightings_plate_number'), 'vehicle_sightings', ['plate_number'], unique=False)

    # 4. police_reports
    op.create_table(
        'police_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('report_number', sa.String(length=100), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('case_number', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('filed_by', sa.String(length=200), nullable=False),
        sa.Column('witness_or_complainant', sa.String(length=200), nullable=True),
        sa.Column('suspects_mentioned', sa.String(length=500), nullable=True),
        sa.Column('incident_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_police_reports_id'), 'police_reports', ['id'], unique=False)
    op.create_index(op.f('ix_police_reports_report_number'), 'police_reports', ['report_number'], unique=True)
    op.create_index(op.f('ix_police_reports_case_number'), 'police_reports', ['case_number'], unique=False)


def downgrade() -> None:
    pass
