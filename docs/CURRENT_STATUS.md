# OpenRepairDB — current project status

Last documented: 2026-11-11. This is a handover snapshot, not a verified live deployment report.

## Setup
- GitHub: `spencerandhillAI/OpenRepairDB`, testing branch `develop`, stable `main`.
- Unraid + Portainer: stack `openrepairdb-test`, Git-managed via `docker-compose.test.yml`.
- Local UI: `http://192.168.178.98:1240`; Portainer: `http://192.168.178.98:1237`.
- Persistent PostgreSQL: do not delete volume.
- GitHub Actions builds develop images; user performs Pull and redeploy.

## Data and verified user observations
- 50 Open Repair Alliance repair attempts imported. Initially malformed CSV mapping; correction script `scripts/fix-openrepair-50.mjs --apply` reported successful correction of 50 cases with IDs/links preserved.
- Linked pilot import reported 5 devices, 5 boards, 20 components and 5 device-board links. No invented component placements or repair links.
- User saw Arduino UNO R3 at DEV-000001, linked to Arduino UNO R3 PCB.
- `scripts/migrate-device-documentation.mjs` successfully ran twice; first migration reported `device_documentation` ready and no existing records changed.
- Admin URL fetch was tested against `https://docs.arduino.cc/hardware/uno-rev3`; HTML was retrieved, generic extraction returned description and links but no technical specifications or pin groups.

## Most recent development (committed, NOT yet runtime-verified)
- Import type dropdown for device, board, component, repair.
- Explicit create vs enrich with source JSON and pending review.
- Fuzzy candidate suggestions with explicit target selection.
- Important: fuzzy SQL uses `similarity` and `%` from PostgreSQL `pg_trgm`. No verified migration for this extension yet. Test before use.
- The current code must be checked against actual schema and build; no claims of production readiness.

## Immediate next step
Check GitHub Actions build, ensure `pg_trgm` exists, test the importer's fuzzy suggestion preview with Arduino UNO R3 and inspect the results. Do not save before verifying candidates and target selection.

## Working style
User prefers concise German, concrete Portainer/Unraid GUI instructions. Assistant commits to GitHub; user redeploys and shares screenshots. Do not ask for administrator secret.

## Administration requirements added
- The administrator feature set is now specified in `docs/ADMINISTRATION_AND_ROLES.md`: importer, user management, password reset, rights/roles, moderation and audit.
- **Requirements only:** user/password/role administration is not implemented. Current `ADMIN_IMPORT_KEY` is importer-only temporary access control.

## Manufacturer autocomplete (committed, not runtime-verified)
- Admin import now has a free-text manufacturer input for devices, boards and components; repair cases have none.
- Native browser datalist combines category-specific starter manufacturers with names from the existing `manufacturers` table, retrieved via authenticated `manufacturers` API action.
- The selected/typed manufacturer is passed separately to preview/save and overrides JSON manufacturer. New names remain permitted and are inserted during save.
- Test after GitHub Actions build and Portainer redeploy. No migration required for this feature.

## Manufacturer autocomplete mobile fix
- User reported browser-native datalist did not display suggestions on Android/Vivaldi after typing `Ard`.
- Replaced datalist with an explicit, visible, filtered list of clickable manufacturer suggestions, including keyboard Enter/Escape handling. Commit a1de7855; runtime validation pending.
