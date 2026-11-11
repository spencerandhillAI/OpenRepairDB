# OpenRepairDB — Administration, users, passwords and permissions

Status: **requirements and target design**, not a claim of existing functionality.

## Administrator responsibilities (protected admin area)
1. **Data import:** choose device, board, component or repair case/guide; fetch URLs or upload/paste JSON; inspect extraction, provenance, licence and duplicate candidates; explicitly create, enrich or reject; manage imports and import history.
2. **User management:** list, search, invite/create, activate, deactivate, suspend and (where appropriate) delete or anonymize accounts; manage account status; never silently destroy authored repair content.
3. **Password and access management:** initiate password reset via expiring single-use token, revoke active sessions, require password change and manage account recovery. Never display, export, email or store plaintext passwords; use an established password hashing scheme (e.g. Argon2id). Administrators cannot read existing passwords or choose a new password without an audited reset flow.
4. **Role and permission management:** assign and revoke roles, inspect effective permissions, define limited editorial permissions and revoke access. Enforce permissions server-side on every API/action, not just by hiding UI controls.
5. **Content moderation:** review, approve, reject, unpublish, correct or archive submitted devices, boards, components, repair guides, images and relationships; review provenance, technical safety and copyright/licensing.
6. **Data integrity and provenance:** resolve duplicates and merge records only after explicit confirmation, with audit trail, redirects/ID preservation where feasible; manage source metadata and verified/unverified status.
7. **Audit and operations:** view security-relevant activity and import/moderation logs, revoke compromised credentials, monitor failed access attempts; restrict sensitive settings to highest privilege administrators.

## Proposed roles (to be implemented)
- **Guest:** read publicly approved information; no write access.
- **Registered user:** manage own profile/password; submit drafts and track own contributions.
- **Contributor:** create and edit own draft technical records, not publish or edit other users' approved data.
- **Moderator/Editor:** review technical submissions, edit and approve content within granted scope; no user/password/role administration by default.
- **Administrator:** data import, user management, password reset initiation, permissions, moderation and audit operations.
- **Superadministrator (optional):** manage administrator assignments and critical security settings, with safeguards against removal of last active superadministrator.

A user may hold multiple roles; define explicit permissions rather than relying only on role names. Apply least privilege. The final role model requires implementation and testing.

## Security requirements
- Authenticated server-side sessions with secure cookies, CSRF protection, rate limiting and session revocation; use HTTPS when deployed outside trusted local testing.
- Password hashes only; reset via time-limited, single-use tokens; do not log credentials or reset tokens.
- Admin operations require reauthentication for particularly sensitive changes (role escalation, password reset, account deletion).
- Log actor, action, target, timestamp and outcome; never log secrets.
- Protect against privilege escalation, self-lockout and deleting the last administrator.
- Apply safe, reversible database migrations and preserve existing data.
- Current `ADMIN_IMPORT_KEY` is **temporary** and controls only the importer; it is not a complete user or role management system.

## UI target
Protected `/admin` dashboard with navigation for Imports, Users, Roles & Permissions, Moderation, Sources & Duplicates, Audit Log, Settings. Show only authorized actions, while still enforcing all authorization server-side.

## Implementation sequence
1. Authentication, sessions, account schema, password reset.
2. Role/permission schema and server-side authorization checks.
3. Protected admin dashboard and user/role management.
4. Migrate importer from shared key to admin permission; remove shared key when safe.
5. Moderation, audit, and operational tooling.

No implementation of user/password/role administration is implied by this document.
