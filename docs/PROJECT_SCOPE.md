# OpenRepairDB — Project scope

## Product vision

OpenRepairDB is a device-centric repair knowledge base. It connects information scattered across repair forums, service documents, datasheets, photos and individual repair experiences.

The central object is the **device**, connected to its assemblies, circuit boards, components, faults, documents and repair cases.

## Core search use cases

Users should be able to search for:
- Manufacturer and exact model or model family.
- Product number, type number, E-number or other manufacturer identifier.
- PCB, board, assembly or module identifier.
- Component marking or part number.
- Fault code, symptom or known failure description.

Results should show direct matches and useful relationships, such as other devices using the same board.

## Knowledge types

- Devices and model variants.
- Boards, modules and assemblies.
- Electronic and mechanical components.
- Typed relationships: installed-in, compatible-with, same-as, revision-of and replaces.
- Repair cases: symptoms, diagnosis, measurements, actions, outcome and tools.
- Technical documents: manuals, datasheets, schematics and service information.
- Media: photographs, annotated images and diagrams.
- Faults, symptoms, external source references and licence records.

## MVP — first usable release

1. Search page with one prominent search field.
2. Device detail page with identifiers and structured technical information.
3. Board and component pages linked to all known related devices.
4. Repair case entry and display.
5. Image and document references with source and licence metadata.
6. Admin review workflow for community submissions.
7. Search by model, board number, component number and fault code.
8. Visible confidence, review status and source citations.

## Out of scope for the first release

- Unrestricted crawling or copying of third-party websites.
- Automatic publication of AI-generated repair instructions.
- Public unmoderated file uploads.
- Complex semantic search before reliable structured data exists.
- Native mobile apps.
- A commercial parts marketplace or repair booking system.

## Data quality

- Preserve original identifiers exactly as printed; store normalized search forms separately.
- Never merge boards solely because their labels look similar.
- Distinguish confirmed facts, user reports, inferred relationships and AI suggestions.
- Record source URL, author or organisation, date, licence and attribution requirements.
- Preserve revisions and corrections instead of silently overwriting technical facts.
- Allow multiple sources to support or contradict a claim.

## Community and moderation

Public contributions should enter a reviewable state. Roles should include visitors, contributors, reviewers and administrators. Uploads must be validated, size-limited, scanned where possible and served safely. Abuse controls, rate limiting, audit history, backups and a takedown/contact process are required before public registration.

## Success criteria

A user enters a model number and quickly discovers the correct device, related boards and components, repair cases, known faults, relevant documents and images, and the origin and reliability of each item.

## Future roadmap — cross-manufacturer spare parts and compatibility

Extend the existing `compatible-with`, `same-as` and `replaces` relationships into a searchable spare-parts and interchangeability catalogue, integrated into OpenRepairDB rather than a separate product.

- Search by device/model, original spare-part number, assembly or component identifier.
- Show original parts, verified equivalent parts, compatible alternatives and replacement/supersession chains across manufacturers.
- Link compatibility claims to specific device variants, board revisions and applicable conditions; distinguish mechanical, electrical and functional compatibility.
- Record evidence, provenance, confidence, review status and conflicting reports; do not infer interchangeability solely from similar part numbers.
- Allow human-readable views and a structured, documented API for external tools and AI agents.
- Optionally add supplier availability and purchase links later, subject to licensing and neutrality; no marketplace required.

**Timing:** Post-MVP; first establish reliable device/part identifiers and reviewed relationship data.

## Future roadmap — dedicated fault-code search

Provide a dedicated **Fault codes** search area in OpenRepairDB, alongside the general search.

- Search using only a fault code, without specifying any device.
- Optionally combine the code with manufacturer, device category, model family or exact model/type number.
- Allow manufacturer-only filtering (e.g. all known Siemens washing machines), even when the user's exact model is not in the database.
- Show results from related models and model families when no exact match exists, clearly marked as **potentially relevant**, not confirmed for the requested device.
- Distinguish the same fault-code string across different manufacturers, categories, models and revisions; never assume identical meaning.
- Show fault meaning, possible causes, diagnostic steps, linked repair cases, evidence and source/review confidence when available.
- Support both a simple search box and optional progressive filters for manufacturer, device category and model.
- Keep fault-code records structured for future API and AI-agent access.

**Timing:** Expand the MVP's existing basic fault-code search into a dedicated discovery experience in a subsequent milestone.
