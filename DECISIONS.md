# Engineering Decisions

## Assumptions
- Staff accounts are pre-provisioned by the business (seeded accounts), so public self-registration is intentionally omitted.
- A single extra field (`priority`: `LOW`, `MEDIUM`, `HIGH`) was added to help staff quickly triage urgent customer requests without bloating the core workflow.
- Customers may legitimately submit multiple inquiries over time, so repeat submissions are not hard-blocked; instead, the submit button disables while saving to prevent accidental double-clicks.

## Key Design Choices

### 1. Ownership & Access Control (Enforced in the API)
- **Rule:** Implemented role-based ownership (`STAFF` vs `ADMIN`). `STAFF` members can only view and update inquiries they recorded; `ADMIN` (Manager) can view and manage all inquiries.
- **Enforcement:** Authentication uses `HttpOnly` JWT cookies verified on every request via Express middleware (`requireAuth`). Both `GET /api/inquiries/:id` and `PATCH /api/inquiries/:id/status` verify `createdById === req.user.id || req.user.role === 'ADMIN'` on the server, returning `403 Forbidden` even if a user navigates directly to another staff member's inquiry URL.

### 2. Strict Status Lifecycle (State Machine)
- **Rule:** Enforced a linear lifecycle: `NEW -> IN_PROGRESS -> RESOLVED`. Jumping directly from `NEW` to `RESOLVED` or reopening a `RESOLVED` inquiry is rejected by the API with `400 Bad Request`.
- **Reasoning:** Prevents inquiries from being accidentally closed without being worked on and keeps the workflow predictable and easy to audit.

### 3. Stale Data Handling (Optimistic Concurrency Control)
- **Rule:** Added an integer `version` column (starting at `1`) to the `Inquiry` model. Every status update requires the client's current `version` and executes an atomic `WHERE id = ? AND version = ?` update that increments `version`.
- **Behavior:** If Tab 1 updates an inquiry (`version` 1 → 2), Tab 2's stale update (`version: 1`) is rejected with `409 Conflict` (`STALE_DATA`). The UI catches `409` and displays a warning banner with a one-click **Refresh** button to load the latest state.

## Accepted Trade-Off
- **Optimistic Locking vs. Real-Time Updates:** Using version-based optimistic locking instead of WebSockets or polling keeps the backend stateless and simple while still guaranteeing zero silent overwrites. The trade-off is that a user in a second tab only learns the record is stale when they attempt to save a change.

## Testing & Known Gaps
- **Covered:**
  - Backend integration tests verify `401` unauthenticated rejection, `400` Zod input validation, `403` cross-staff ownership enforcement, `400` invalid status transitions, and `409` stale-data conflicts against PostgreSQL.
  - Frontend tests verify client-side validation feedback and server error alert rendering on the inquiry creation form.
- **Gaps:**
  - Full end-to-end browser tests (e.g., Playwright) covering login, navigation, and multi-tab refresh are not automated yet.
  - Backend integration tests currently run against the local development database (cleaning up only records created by the test suite) rather than an isolated ephemeral test database.

## What I Would Improve Next
1. Add an `InquiryActivity` / notes table so staff can see a chronological log of what happened last on each status update.
2. Add cursor/offset pagination to `GET /api/inquiries` as inquiry volume grows.
3. Introduce an isolated test database and Playwright E2E tests in a CI pipeline.

## Use of AI
- **Where AI helped:** Scaffolding boilerplate Express/Prisma routes, Tailwind CSS layouts, and Jest/Vitest configuration files.
- **Accepted:** Storing JWTs in `HttpOnly` cookies rather than `localStorage` to mitigate XSS exposure, and using integer `version` optimistic locking to cleanly demonstrate the two-tab stale-data scenario.
- **Changed / Rejected:** Rejected an initial idea to hard-block duplicate submissions within 5 minutes on the backend, because a customer might legitimately report two separate issues with similar subjects; replaced it with submit-button locking to prevent double-clicks. Also downgraded Prisma from v8 RC to v6 LTS to keep local migrations simple and stable.