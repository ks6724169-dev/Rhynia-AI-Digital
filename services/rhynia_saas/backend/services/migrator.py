"""
Rhynia Intelligence SaaS — Automated Database Migrator
Automatically executes any new .sql files in the migrations/ folder
against Supabase PostgreSQL upon deployment.
"""

import logging
import os
from pathlib import Path
from sqlalchemy import text
from services.rhynia_saas.backend.database import engine

logger = logging.getLogger("rhynia.migrator")


def run_sql_migrations() -> None:
    """Find and execute unapplied .sql migrations in alphabetical/timestamp order."""
    migrations_dir = Path(__file__).resolve().parent.parent.parent.parent / "migrations"
    if not migrations_dir.exists():
        migrations_dir = Path(__file__).resolve().parent.parent / "migrations"

    if not migrations_dir.exists():
        logger.info(f"No migrations folder found at {migrations_dir}, skipping.")
        return

    sql_files = sorted(list(migrations_dir.glob("*.sql")))
    if not sql_files:
        logger.info("No .sql files found in migrations folder.")
        return

    try:
        with engine.connect() as conn:
            # Create schema_migrations tracking table if not exists
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS schema_migrations (
                        version VARCHAR(255) PRIMARY KEY,
                        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                    );
                    """
                )
            )
            conn.commit()

            # Fetch already applied migrations
            result = conn.execute(text("SELECT version FROM schema_migrations;"))
            applied = {row[0] for row in result.fetchall()}

            for sql_file in sql_files:
                if sql_file.name not in applied:
                    logger.info(f"Applying new database migration: {sql_file.name}")
                    sql_content = sql_file.read_text(encoding="utf-8")
                    if sql_content.strip():
                        # Execute SQL statements
                        conn.execute(text(sql_content))
                        conn.execute(
                            text("INSERT INTO schema_migrations (version) VALUES (:ver);"),
                            {"ver": sql_file.name},
                        )
                        conn.commit()
                        logger.info(f"Successfully applied migration: {sql_file.name}")
                else:
                    logger.debug(f"Migration already applied: {sql_file.name}")

    except Exception as e:
        logger.error(f"Error executing database migrations: {e}")
