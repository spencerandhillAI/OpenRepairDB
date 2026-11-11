# Pilot: verified device / board / component graph

Status: Phase 1 prepared. Phase 2 requires source-backed device identification. Do not fabricate models or associations.

## Goal
Build a small navigable, evidence-backed graph:
- 5 specific device models (DEV), not just generic product categories
- Up to 5 identified physical boards (BRD), with revisions where known
- Up to 20 real parts (CMP) supported by manufacturer documentation or a suitable open library
- Preserve the 50 imported Open Repair Alliance cases (REP) without guessing device or board links

## Phase 1: audit
Run `node scripts/audit-openrepair-50.mjs` in the web container console. This is read-only and reports actual database counts, data completeness, source licences, and existing links. Do not re-import the 50 records.

## Evidence policy
- A device must have an exact, verifiable model identifier and an authoritative source URL.
- A board must have an identifiable board number, preferably revision and photograph or service document with reuse rights assessed separately.
- Link device to board only with explicit evidence (service manual, official parts list, clear photo or reliable repair record).
- Link board to component only when board placement is supported by a schematic, BOM, or verified board inspection. A component existing in LibrePCB does not prove it is installed on a particular board.
- A generic repair case (e.g. 'Brand X washing machine') is not enough to link to a specific device.
- Imported or inferred relationships start pending review, and only approved relationships are public.
- Each imported record needs provenance and licence. CC0 component libraries can supply generic part records, not device-specific placement.
- No unlicensed image copying. Images and role-based review remain separate planned features.

## Candidate data sources
- Open Repair Alliance: https://github.com/openrepair/data (CC BY-SA 4.0) for repair attempts.
- LibrePCB libraries: https://github.com/LibrePCB-Libraries (verify each repository's licence) for electronic component descriptions.
- Manufacturer product and service documents for *verification and linking*, without assuming reproduction rights.

## Next implementation
1. Inspect audit output and identify which fields are missing.
2. Select five *verifiable* models from reliable sources; store source metadata.
3. Add an idempotent, review-gated import script for those five models and their identifiers.
4. Identify and link physical boards and parts only where documented.
5. Extend detail pages with identifiers, related devices and source references.
