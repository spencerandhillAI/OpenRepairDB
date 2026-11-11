# Unraid deployment notes

Target: Unraid 7.3.4.

## Planned services

- `openrepairdb-web`: Next.js application, host port 3000 during initial testing.
- `openrepairdb-db`: PostgreSQL 17, internal Docker network only.
- Named Docker volume for PostgreSQL data during the first local test.

## Before production

1. Create a dedicated appdata directory and decide the backup destination.
2. Copy `.env.example` to `.env` and set a long random database password.
3. Set `DATABASE_URL` to use the same password as `POSTGRES_PASSWORD`.
4. Build and start with Docker Compose.
5. Confirm the web interface and database health.
6. Move persistent database data to the intended Unraid appdata path if required by the final deployment policy.
7. Configure HTTPS and reverse proxy; do not publish the database port.
8. Configure and test database plus media backups.

The current compose file is a development foundation, not yet a hardened public production deployment. The database schema is provided separately and will be wired into automated migrations before the first functional data-entry release.
