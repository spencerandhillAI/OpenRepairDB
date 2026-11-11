# OpenRepairDB

**An open, community-driven technical knowledge base for repairing devices.**

OpenRepairDB connects repair knowledge across device models, manufacturers, circuit boards and components. Search should work not only by model number, but also by PCB identifier, component marking, fault code or symptom.

## Project goals

- Search by manufacturer, model, product identifier, PCB/board number, component marking and fault code.
- Connect devices that share boards, components or assemblies.
- Store structured technical facts alongside repair guides, photos, diagrams and documents.
- Preserve source, author, date and licence information for every item.
- Combine automated research with community contributions.
- Remain free, open source, self-hostable and useful without a proprietary cloud service.

## Status

**Foundation phase.** This repository contains the initial scope, architecture principles and conceptual data model. No production deployment or data import has been performed yet.

## Documentation

- [Project scope](docs/PROJECT_SCOPE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data model](docs/DATA_MODEL.md)
- [Contributing](CONTRIBUTING.md)

## Initial technical direction

The first implementation will favour a small Docker-based deployment:

- PostgreSQL as the system of record.
- PostgreSQL full-text search and trigram matching initially.
- A responsive web application with device-centric pages.
- Persistent file storage, abstracted so it can later move to S3-compatible storage.
- Background import and AI-assisted extraction only after provenance, review and licensing rules are in place.

We will avoid unnecessary services in the first milestone. A dedicated search engine, vector database, workflow engine, object-storage server and local LLM can be added later if measured needs justify them.

## Content, sources and licences

OpenRepairDB must distinguish original contributions, facts and metadata derived from external sources, and third-party text, images, schematics or documents.

External material must not be copied unless its licence or permission allows redistribution. Where redistribution is not allowed, OpenRepairDB should retain a reference and link to the original source rather than republishing the material. Each item must retain provenance and applicable licence details.

The software licence and contributed database-content licences will be defined separately before public contributions are enabled.

## Safety

Repair information can involve mains voltage, batteries, stored energy and high temperatures. Safety warnings, source quality, review status and uncertainty must be visible. OpenRepairDB is a knowledge resource, not a substitute for qualified judgement or manufacturer safety instructions.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.
