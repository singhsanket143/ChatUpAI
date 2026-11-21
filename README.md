# ChatUp (backend course)

## Database migrations (Alembic)

From the project root, with the virtualenv active and Postgres running (`docker compose up -d postgres`):

1. **Initialize Alembic** (once per project):

   ```bash
   alembic init alembic
   ```

   Configure `alembic.ini` (`sqlalchemy.url`) and `alembic/env.py` before creating revisions.

2. **Create the first migration** (edit the generated file under `alembic/versions/` as needed):

   ```bash
   alembic revision -m "Create users table"
   ```

3. **Apply migrations** to the database:

   ```bash
   alembic upgrade head
   ```