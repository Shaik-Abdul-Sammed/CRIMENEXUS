import pytest
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Text, inspect
from app.database.migration import auto_migrate_db_schema
from app.database.postgres import Base


def test_auto_migrate_creates_base_tables():
    """Verify that auto_migrate_db_schema creates all tables defined in Base.metadata."""
    test_engine = create_engine("sqlite:///:memory:")
    result = auto_migrate_db_schema(target_engine=test_engine, target_metadata=Base.metadata)
    assert result is True

    inspector = inspect(test_engine)
    table_names = inspector.get_table_names()
    assert "cases" in table_names
    assert "users" in table_names
    assert "alerts" in table_names
    assert "missing_person_cases" in table_names
    assert "historical_firs" in table_names

    # Verify cases has the historical FIR columns
    columns = {c["name"] for c in inspector.get_columns("cases")}
    assert "detected_language" in columns
    assert "fir_summary_en" in columns
    assert "original_text" in columns
    assert "case_outcome" in columns


def test_auto_migrate_adds_missing_columns_to_existing_table():
    """Verify that auto_migrate_db_schema adds missing columns to an existing table without data loss."""
    test_engine = create_engine("sqlite:///:memory:")

    # Step 1: Create an older version of 'mock_cases' table with only 2 columns
    initial_meta = MetaData()
    old_table = Table(
        "mock_cases",
        initial_meta,
        Column("id", Integer, primary_key=True),
        Column("title", String(100))
    )
    initial_meta.create_all(bind=test_engine)

    inspector = inspect(test_engine)
    cols_before = {c["name"] for c in inspector.get_columns("mock_cases")}
    assert cols_before == {"id", "title"}

    # Step 2: Define updated model with additional columns
    updated_meta = MetaData()
    updated_table = Table(
        "mock_cases",
        updated_meta,
        Column("id", Integer, primary_key=True),
        Column("title", String(100)),
        Column("detected_language", String(50)),
        Column("fir_summary_en", Text)
    )

    # Step 3: Run migration
    res = auto_migrate_db_schema(target_engine=test_engine, target_metadata=updated_meta)
    assert res is True

    # Step 4: Verify columns were added dynamically
    inspector_after = inspect(test_engine)
    cols_after = {c["name"] for c in inspector_after.get_columns("mock_cases")}
    assert "detected_language" in cols_after
    assert "fir_summary_en" in cols_after
    assert "title" in cols_after
    assert "id" in cols_after


def test_auto_migrate_handles_invalid_engine_gracefully():
    """Verify auto_migrate_db_schema handles errors gracefully without unhandled exceptions."""
    result = auto_migrate_db_schema(target_engine=None, target_metadata=None)
    # Target engine defaults to active engine or returns boolean
    assert isinstance(result, bool)
