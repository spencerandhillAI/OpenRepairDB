# Images, media and permissions — planned requirements

Status: planned, not implemented. This document records requirements for future OpenRepairDB development.

## Media
- Support multiple images per device, board, component and repair case, including annotated fault locations, with captions and ordered galleries.
- Store provenance per image: uploader, creator/rightsholder, original source URL, licence identifier and URL, attribution text, upload date, review decision and version history.
- Preserve licence terms on imported media. Publicly viewable is not equivalent to reusable; never copy images from third-party sites without suitable rights.
- Separate original private uploads from approved public derivatives. Strip EXIF/GPS and other metadata from published derivatives, validate actual file types and sizes, decode/re-encode images, and generate safe thumbnails.
- Do not allow executable uploads, SVG scripts or direct public access to unreviewed originals. Use isolated storage and signed/private access where appropriate.
- Provide reporting, takedown and correction workflows; respect deletion requests and preserve an audit trail where lawful.
- Avoid publicly exposing serial numbers, addresses, faces and other personal information without appropriate review.

## Roles and permissions
- Visitor: read approved public records and approved media.
- Registered contributor: create and edit own draft submissions; upload media to private pending review; report issues.
- Moderator: inspect submissions and media, approve/reject with reasons, redact sensitive content and handle reports.
- Administrator: manage roles, sources, moderation policy and system configuration; administrative access audited.
- Use least privilege and server-side authorization for every operation, not only UI hiding. No contributor can self-approve or grant roles.
- Moderation status for content and each media asset: draft/pending/approved/rejected/quarantined. Only approved items may appear in public search and public media URLs.
- Record uploader, reviewer, timestamps and changes. Rate-limit uploads and authentication, enforce quotas, scan files, and prevent IDOR/unauthorized access.
- Add account recovery, secure sessions, optional MFA for moderators/admins, and backups with restore testing.

## Import and licence rules
- Preserve item-level source and licence metadata. Mixed licences must remain distinguishable.
- OpenRepairDB is intended to operate noncommercially and may accept donations; this does not override licences that permit commercial reuse.
- Do not assume a licence for unlabelled photos, third-party attachments or manufacturer diagrams.
- Image storage and moderation require explicit schema migrations for existing databases; init scripts alone will not migrate an existing PostgreSQL volume.

## Implementation order
1. Database schema for media assets, attachments, moderation decisions and role assignments.
2. Authentication and server-side authorization.
3. Secure upload pipeline and private pending storage.
4. Moderator queue, image gallery and attribution UI.
5. Source-specific licensed media importers, with audit and takedown support.
