# OpenRepairDB — Initial data model

Conceptual design only; this is not yet a database migration.

## Core entities

### Manufacturer
- id, name, aliases

### Device
- id, manufacturer_id, canonical model name, product category, description, lifecycle status, timestamps

### DeviceIdentifier
- id, device_id, identifier type (model, product number, type number, E-number, etc.), original value, normalized value, source_id, verification status

A device can have multiple identifiers and model variants. One model string must not be assumed to uniquely identify every regional or hardware revision.

### Board
- id, manufacturer or brand if known
- original and normalized board identifier
- board type (mainboard, power supply, inverter, control board, display board, etc.)
- revision and notes

### Component
- id, manufacturer if known
- original and normalized part number
- marking and component type
- datasheet/source references

### Assembly and relationships

Relationships connect devices, boards, components and assemblies. Initial relationship types:
- installed_in
- contains
- same_as
- compatible_with
- revision_of
- replaces
- possibly_used_in

Each relationship stores evidence, confidence and review status. A possible relationship must never be presented as confirmed compatibility.

### Fault and symptom
- id, canonical title, description, fault code, category

### RepairCase
- id, device_id (nullable if unidentified)
- symptom and fault links
- diagnosis
- measurements (value, unit, test point and conditions)
- repair actions, parts and tools used
- outcome and verification status
- safety notes, author, timestamps and review status

### TechnicalDocument and Media

Metadata and storage reference:
- title and description
- document or media type
- file checksum and storage key
- source_id
- licence and attribution
- visibility and review status
- uploader and creation date

### Source and provenance

Every external or user-provided item needs:
- source type and source name
- canonical URL or contribution reference
- author or rights holder where known
- licence identifier and licence URL
- attribution text
- retrieval or contribution date
- permitted use (link-only, metadata-only, redistribution permitted, permission required, unknown)
- checksum for retained files
- review notes

## Modelling rules

1. Preserve exact printed identifiers and store normalized values separately.
2. Do not make board identifiers globally unique unless evidence proves they are.
3. Model revisions explicitly; similar PCB numbers do not prove interchangeability.
4. Keep claims separate from sources so multiple sources can support or challenge a fact.
5. Record whether a relationship is confirmed, reported, inferred or AI-suggested.
6. Store measurements with units and test conditions.
7. Separate software licensing from database and content licensing.
8. Keep corrections and superseded facts auditable where appropriate.

## Initial search indexes

Index normalized device identifiers, board identifiers, component numbers and markings, fault codes, and searchable text across names, symptoms and descriptions.

Direct matches should rank ahead of related results. Every related result must show its relationship type and supporting evidence.
