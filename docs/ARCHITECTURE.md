# OpenRepairDB — Initial architecture

## Principles

1. External websites are sources, not the canonical database.
2. Structured identifiers and relationships are first-class data.
3. Every imported or contributed claim must be traceable.
4. Start with few services; add complexity only when justified.
5. Use portable Docker deployment and documented configuration.
6. Automation may suggest or extract information, but must not silently publish uncertain technical claims.

## Initial service layout

- **Web application:** public search and device pages, plus authenticated contribution and review screens.
- **PostgreSQL:** canonical records, relationships, users, provenance and initial full-text search.
- **Persistent media storage:** original uploads and generated previews, separated from the database.
- **Background worker (later):** imports, OCR, thumbnail generation and AI-assisted extraction.

We will not deploy a separate search engine, vector database, workflow engine, object-storage server or local LLM in the first milestone. PostgreSQL can cover initial search needs.

## Search strategy

Phase 1:
- Exact and normalized identifier matching.
- Case-insensitive matching.
- PostgreSQL full-text search for titles, symptoms and descriptions.
- Trigram similarity for typos and partial model identifiers.

Later:
- Faceted search and improved ranking.
- Optional semantic search using embeddings.
- Dedicated search service only if PostgreSQL no longer meets measured latency or relevance targets.

## Data flow

1. A contributor enters a device, board, component, repair case or source.
2. The application validates fields and records provenance.
3. New community submissions enter a pending/review state.
4. A reviewer checks identity, evidence, licence and safety information.
5. Approved records become publicly searchable.
6. Import adapters may collect permitted metadata from external sources.
7. AI extraction creates drafts linked to exact source material; a human approves them.

## Unraid deployment

Target host: Unraid 7.3.4, Intel Core i5-14600K, 128 GB RAM and 30 TB storage.

Deployment will use Docker containers and persistent appdata paths. Before installation we will choose the exact appdata directory, define a dedicated Docker network, keep credentials out of Git, expose only the web interface through the intended reverse proxy, and document backup and restore procedures.

Do not expose PostgreSQL directly to the public internet. Database and media files need separate backup policies. Storage capacity does not replace quotas, retention rules or backups.

## Security baseline

- No default administrator password.
- Secrets only in local environment configuration.
- Least-privilege database user.
- Strict upload allowlist, MIME/type validation and size limits.
- Randomized stored filenames; never trust uploaded paths.
- Rate limiting and abuse protection.
- Audit log for moderation and sensitive changes.
- Regular database and media backups with restore tests.
- HTTPS at public ingress.
- Never execute or directly render uploaded content.

## Decisions before implementation

- Application framework and authentication provider.
- Public URL/domain and reverse-proxy arrangement.
- Exact storage paths and backup target on Unraid.
- Software licence and separate contributor-content licence.
- Public registration at launch or invite-only testing.
