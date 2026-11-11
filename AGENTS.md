# OpenRepairDB — instructions for future development sessions

Read `docs/CURRENT_STATUS.md`, `docs/PROJECT_VISION.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md` and the relevant implementation before making changes. These files are project context, not a substitute for inspecting code and database schema.

## Non-negotiable principles
- Technical facts, device documentation, pinouts, repairs and provenance belong in PostgreSQL or source data files, **never hard-coded as content in application source code**.
- Never fabricate technical specifications, relationships, diagnoses, sources, licensing permissions or verification status.
- Import must be administrator-only, reviewable, provenance-aware and duplicate-safe. Fuzzy matches are suggestions, never automatic merges.
- Do not overwrite nonempty existing values automatically. Preserve source attribution and original imported payloads.
- Protect the persistent PostgreSQL volume. Schema changes must use safe repeatable migrations; do not assume `db/init` reruns on existing databases.
- Work on `develop` first; `main` is stable. Do not claim deployment or successful testing until confirmed.
- The user operates Unraid/Portainer manually; give short German instructions, one test at a time. Do not ask for secrets.
- Before completing a meaningful task, update `docs/CURRENT_STATUS.md` and `docs/ROADMAP.md`; record major design decisions in `docs/DECISIONS.md`.
- Always verify existing file content before edits, and check GitHub Actions and runtime results when available.

- Administrator responsibilities, user management, password resets and permission rules are specified in `docs/ADMINISTRATION_AND_ROLES.md`. Consult it before implementing auth or admin features.

## Project entry points
- GitHub: `spencerandhillAI/OpenRepairDB`
- Documentation: `docs/PROJECT_VISION.md`, `docs/CURRENT_STATUS.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/IMPORT_PIPELINE.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`
