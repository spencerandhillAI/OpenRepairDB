# Technology decisions — first implementation

Status: initial choices for the MVP; revisit only when a concrete requirement justifies it.

## Web application: Next.js + TypeScript

The first interface uses the Next.js App Router and TypeScript. This gives us one application for the public website, server-rendered pages and later authenticated contribution/review screens. It avoids maintaining a separate frontend and API service at the beginning.

## Database: PostgreSQL

PostgreSQL is the canonical data store. It supports relational links between devices, boards, components, repair cases and sources, plus full-text and trigram search extensions. The initial implementation uses the `pg` driver and parameterized SQL; we can introduce an ORM if schema complexity or team workflow makes it worthwhile.

## Search: PostgreSQL first

The initial search covers approved devices, device identifiers, board identifiers, component numbers/markings and repair-case titles/fault codes. Search-engine or vector infrastructure is deferred until real data and usage show a need.

## Runtime: Docker Compose

The first self-hosted deployment consists of the web application and PostgreSQL. PostgreSQL is only reachable on the internal Compose network. The web interface is exposed on port 3000 for local testing.

## Dependency reproducibility

The initial manifest uses npm's current stable package releases. Before production deployment, generate and commit `package-lock.json`, then change the Docker build to use `npm ci`. This pins the dependency tree and makes subsequent builds reproducible.

## Deliberately deferred

- Separate FastAPI service.
- Meilisearch / Elasticsearch.
- Vector database and semantic search.
- n8n or other workflow automation.
- MinIO or external object storage.
- Local LLM runtime and automated web crawling.

These remain possible future extensions, not prerequisites for the first working version.
