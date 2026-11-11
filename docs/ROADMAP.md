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

## Planned extensions
- **Cross-manufacturer spare-parts and compatibility catalogue:** Extend OpenRepairDB's device, board, assembly and component relationships to find original spare parts, equivalent replacements and compatible alternatives across manufacturers. Search by device/model and part number; record exact applicability, revision, compatibility conditions, sources, confidence and review status. Provide human-readable results and a structured API for AI agents. Optional supplier links later; not a separate marketplace.
- **Dedicated fault-code search:** Add a separate fault-code search area supporting (a) code alone, (b) code plus manufacturer/category/model, and (c) manufacturer-only browsing without an exact model number. If a specific device is missing, surface fault-code matches from similar models or model families, explicitly labelled as unverified for that device. Distinguish identical codes across manufacturers and models; show meanings, possible causes, repair references, sources and confidence. Make results accessible to humans and future AI/API clients.

- **Manuals and technical documentation library (idea 9):** Collect and index user manuals, service manuals, schematics, exploded-view drawings, datasheets and other technical documents. Associate each document with the correct manufacturer, device/model, board, component or revision; provide searchable metadata, document type, language, version, source, licence and review status. Support community submissions with moderation and duplicate detection. Host original files only when redistribution rights permit; otherwise link to the official or authorized source. Integrate into existing device and component detail pages and search rather than building a separate platform.

## Long term
- Community submissions, verified repair knowledge, traceable technical documentation and sustainable open-source maintenance.

Update this file as work is completed. Do not mark a feature verified merely because code was committed.
