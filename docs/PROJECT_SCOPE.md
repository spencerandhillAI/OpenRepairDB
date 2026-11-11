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

