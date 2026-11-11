# OpenRepairDB — import pipeline

## Intended workflow
1. Admin selects **device**, **board**, **component**, or **repair case/instruction**.
2. Admin enters source HTTPS URL or structured JSON.
3. Fetch only allowlisted remote domains; prevent unsafe remote requests.
4. Extract factual content into editable JSON; attach source URL. Manufacturer may need manual input.
5. Validate fields, run exact duplicate check and fuzzy similarity suggestions.
6. Admin explicitly selects an existing target to enrich, or chooses new record.
7. Preview and explicit confirmation; save transactionally with provenance and pending review.
8. Publish only through the appropriate review workflow (not fully implemented).

## Current implementation (needs runtime validation)
- UI: `src/app/admin/import/page.tsx`
- API: `src/app/api/admin/import/route.ts`
- Entity import: `src/lib/admin-entity-import.ts`
- HTML extraction: `src/lib/html-guide-extractor.ts`
- DB migration: `scripts/migrate-device-documentation.mjs`
- Original imported JSON stored in `imported_entity_documents` after migration.
- Fuzzy matching currently uses PostgreSQL similarity functions; verify `pg_trgm` extension is installed before relying on it.
- Generic HTML extraction often misses JS-rendered technical specs and PDF pinouts.
- Importer currently uses a secret key, not proper admin accounts. Audit, authorization, license review, publish/reject workflows remain open.

## Specific test case
Arduino UNO R3: existing device DEV-000001 (as observed in test UI). Manufacturer is `Arduino`; imported HTML often yields `model: UNO R3` but not `manufacturer`. Ensure it suggests the existing record rather than creating a duplicate.
