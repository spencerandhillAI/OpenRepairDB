# OpenRepairDB — decision log

- **Git workflow:** develop for testing; main for stable releases. GitHub Actions builds container images; user deploys through Portainer.
- **Persistence:** PostgreSQL volume is persistent; migrations are explicit and safe, not dependent on initial bootstrap scripts.
- **Source of truth:** device documentation and technical facts in database or data files, not embedded in UI components.
- **Provenance:** imports retain source URLs, review status, and original JSON payloads where supported.
- **Data integrity:** never invent links between entities; preserve existing IDs and original records.
- **Admin import:** current temporary authentication uses `ADMIN_IMPORT_KEY`; proper role-based authentication remains a future requirement.
- **Duplicates:** exact matches block accidental creation; fuzzy matches are suggestions requiring explicit user selection. Different hardware revisions must not be silently merged.
- **Enrichment:** existing populated fields are not silently overwritten; admin confirms create vs enrich.
- **Source parsing:** generic HTML scraping may extract descriptions, tables and documentation links, but must not claim completeness or invent pinouts.
