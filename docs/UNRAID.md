# Unraid deployment notes

Target: Unraid 7.3.4.

## Services

- `openrepairdb-web`: Next.js application, host port 3000 during initial testing.
- `openrepairdb-db`: PostgreSQL 17, internal Docker network only.
- Named Docker volume for PostgreSQL data.
- The SQL in `db/init` is automatically applied when PostgreSQL creates a new, empty data volume.

## Initial test deployment

1. Clone this repository to a persistent Unraid appdata location.
2. Copy `.env.example` to `.env`.
3. Generate a long random password and set `POSTGRES_PASSWORD`.
4. Set `DATABASE_URL` with exactly the same password, using hostname `db` and database `openrepairdb`.
5. Run `docker compose up -d --build` from the repository directory.
6. Open `http://UNRAID-IP:3000` on the local network.
7. Check container logs and verify that both services are healthy.

Example URL format (replace the password; do not use this literal value):
`postgresql://openrepairdb:YOUR_PASSWORD@db:5432/openrepairdb`

## Important

- Do not expose PostgreSQL port 5432 to the host or internet.
- Do not commit `.env`; it is excluded by `.gitignore`.
- PostgreSQL initialization scripts run only when the data directory is empty. Future schema changes must use versioned migrations, not edits to the already executed initial script.
- Back up the database and uploaded media separately, and test restores.
- Configure HTTPS and a reverse proxy before any public launch.
- This is an initial test deployment, not yet a hardened public production deployment.
