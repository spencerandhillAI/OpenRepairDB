# OpenRepairDB — roadmap

## Immediate
- Verify GitHub Actions build and runtime for fuzzy duplicate suggestions; confirm `pg_trgm` is available and matching works.
- Test device/board/component/repair import modes against real PostgreSQL schema; fix runtime issues without deleting data.
- Test Arduino UNO R3 exact and fuzzy matching, create/enrich selection and pending review.
- Ensure imported technical data actually appears on detail pages after approval, with sources and relevant pinout links.
- Improve HTML/PDF extraction and distinguish related product navigation from true source documentation.

## Next
- Implement protected admin dashboard, user accounts, session authentication, password reset, role/permission management and server-side authorization per `docs/ADMINISTRATION_AND_ROLES.md`.
- Migrate importer from shared `ADMIN_IMPORT_KEY` to role-based admin authorization; add moderation and publish/reject workflow.
- Better import validation, provenance, licensing review, transaction-safe updates and duplicate prevention.
- Richer documentation for devices, boards, components and repair cases.
- Media uploads, permissions and moderation per `docs/MEDIA_AND_PERMISSIONS.md`.
- Continue linked-data pilot without fabricated relationships; see `docs/LINKED_DATA_PILOT.md`.

## Long term
- Community submissions, verified repair knowledge, traceable technical documentation and sustainable open-source maintenance.

Update this file as work is completed. Do not mark a feature verified merely because code was committed.
