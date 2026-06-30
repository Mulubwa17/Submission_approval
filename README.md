# Submission & Approval Workflow

A small two-sided assessment app for application submission and reviewer approval.
The core is a backend-enforced status workflow with an audit trail.

## Submission Access

Git repository:

- `git@github.com:Mulubwa17/Submission_approval.git`

Hosted URL:

- Not deployed yet. The app is fully runnable locally with the documented Docker, database, backend, and frontend steps below. Add the final hosted URL here before final submission.

Test credentials:

| Role | Email | Password |
| --- | --- | --- |
| Applicant | `applicant@example.com` | `password123` |
| Reviewer | `reviewer@example.com` | `password123` |

The two accounts are created by the seed script. The Applicant can create and submit applications. The Reviewer can open submitted applications and approve, reject, or return them for changes.

## Stack

- Frontend: Next.js, TypeScript, Better Auth React client
- Backend: NestJS, TypeScript, Better Auth, Prisma
- Database: PostgreSQL
- Tests: Jest unit tests and a Nest/Supertest authorization test

## Local Setup And Run

1. Copy environment values:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

4. Run migrations and seed users:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Start both apps:

   ```bash
   npm run dev
   ```

Frontend: `http://localhost:3000`

API: `http://localhost:4000/api`

## Deployment Environment

Keep the browser-facing frontend URL and the API URL separate. `localhost`
inside a built frontend bundle means the user's own computer, not the deployed
server.

If the API is running on server IP `44.220.142.122` port `4000` and the
frontend is running locally during testing:

```env
BETTER_AUTH_URL="http://44.220.142.122:4000"
NEXT_PUBLIC_API_URL="http://44.220.142.122:4000"
FRONTEND_ORIGIN="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"
```

If both apps are on the server and the frontend is served from port `3000`:

```env
BETTER_AUTH_URL="http://44.220.142.122:4000"
NEXT_PUBLIC_API_URL="http://44.220.142.122:4000"
FRONTEND_ORIGIN="http://44.220.142.122:3000"
CORS_ORIGINS="http://44.220.142.122:3000,http://localhost:3000"
```

After changing any `NEXT_PUBLIC_*` value, rebuild and restart the frontend so
Next.js writes the new value into the browser bundle.

Useful individual commands:

```bash
npm run dev:api
npm run dev:web
npm run build
npm test
```

## Data Model

The database is PostgreSQL, accessed through Prisma. The schema is intentionally small because the assessment values a correct workflow more than feature breadth.

Authentication tables:

- `user`: Better Auth user record plus a custom `role` field (`APPLICANT` or `REVIEWER`).
- `session`: Better Auth session storage.
- `account`: Better Auth credential/account storage.
- `verification`: Better Auth verification-token storage.

Domain tables:

- `Application`: stores the applicant-owned request, including title, category, description, optional amount, current status, and timestamps.
- `ApplicationAuditLog`: records every status transition with the actor, old status, new status, optional comment, and timestamp.

Application statuses are:

```txt
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
RETURNED
```

Key design decisions:

- `Application.status` is a database enum so invalid statuses cannot be persisted accidentally.
- Status transition logic is centralized in `WorkflowService` instead of being duplicated across controllers.
- Audit logs are written in the same database transaction as the status update, so the application state and audit trail stay consistent.
- Better Auth owns login/session mechanics, while NestJS guards and services still enforce role and ownership checks on every workflow mutation.
- A single shared Prisma client backs both the application services and Better Auth (via a `createBetterAuth(prisma)` factory and an injectable `BetterAuthService`), so the app uses one connection pool instead of several.
- Status transitions use an optimistic concurrency guard: the update only applies while the application is still in the expected status, so two reviewers acting at the same time cannot both record a transition — the loser receives a `409 CONCURRENT_UPDATE`.
- Request inputs are validated at the edge. The reviewer status filter must be a known `ApplicationStatus`, and optional fields are normalized, so malformed input returns `400` rather than surfacing a database error as a `500`.
- Returned applications are reopened to `DRAFT` before editing. This preserves the rule that applicants only edit drafts while still supporting a returned-for-changes loop.

## Workflow Rules

- Applicants can create drafts.
- Only the owner can edit a draft.
- Applicants can submit `DRAFT -> SUBMITTED`.
- Reviewers can move `SUBMITTED` or `UNDER_REVIEW` to review outcomes.
- Rejecting or returning requires a comment.
- Returned applications must be reopened as `DRAFT` before editing, preserving the rule that applicants only edit drafts.
- Concurrent transitions are rejected: if the application already moved to another status, the API returns `409 CONCURRENT_UPDATE` instead of double-recording the change.
- Every transition creates an audit log entry.

The transition rules live in `apps/api/src/workflow/workflow.service.ts` and are covered by unit tests.

## API Shape

Auth is served by Better Auth through the Nest API under `/api/auth/*`.
Workflow mutations are protected again in Nest controllers/services.

Applicant endpoints:

- `GET /api/applications/me`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PATCH /api/applications/:id`
- `POST /api/applications/:id/submit`
- `POST /api/applications/:id/reopen`

Reviewer endpoints:

- `GET /api/review/applications?status=SUBMITTED` (the `status` filter is validated; an unknown value returns `400`)
- `POST /api/review/applications/:id/start-review`
- `POST /api/review/applications/:id/approve`
- `POST /api/review/applications/:id/reject`
- `POST /api/review/applications/:id/return`

## Tests

```bash
npm test
```

Coverage focuses on the assessment rubric:

- legal and illegal status transitions
- required comments for reject/return
- owner-only applicant transitions
- API-level rejection of applicant access to reviewer actions

Manual verification performed locally:

- Applicant login with seeded credentials.
- Reviewer login with seeded credentials.
- Applicant creates a draft application.
- Applicant submits the application.
- Applicant direct API attempt to approve returns `403`.
- Reviewer starts review.
- Reviewer approves with a comment.
- Detail response includes the audit trail for all transitions.
- `npm run build` completes for shared package, API, and web app.

## Trade-offs

- File attachments were intentionally excluded because they are optional and would add storage/deployment complexity without strengthening the core workflow.
- The form is deliberately simple so the implementation effort stays focused on status correctness, authorization, and auditability.
- Returned applications are reopened to `DRAFT` before editing. This keeps the assessment rule "applicants only edit drafts" intact while still supporting a revision loop.
- The reviewer queue includes status filtering. Pagination/search can be added later if the queue grows.
- Auth is intentionally simple and seeded for assessment review. It uses real server-side sessions and role checks, but does not include production account-management features such as password reset, email verification delivery, or admin user management.
- The UI is focused on the core Applicant and Reviewer flows rather than a large dashboard or reporting layer.

With more time, I would add:

- Hosted deployment for the frontend, backend, and managed PostgreSQL database.
- Pagination and search on the reviewer queue.
- A fuller returned-for-changes revision history.
- End-to-end browser tests for the Applicant and Reviewer flows.
- Production hardening around secrets, logging, rate limiting, and deployment health checks.

## Use Of AI Tools

AI tools were used during development, and the generated or assisted work was reviewed before being included.

Tools used:

- Codex (ChatGPT 5.5)
- Claude

How Codex was used:

- Frontend design direction for a clean two-sided workflow interface.
- Next.js implementation for login, Applicant application screens, Reviewer queue, Reviewer detail page, loading/error/success states, and responsive styling.
- README drafting and refinement.

How Claude was used:

- Backend workflow logic review.
- Code cleanup suggestions.
- Test coverage suggestions for legal and illegal transitions.
- Review of authorization paths, especially making sure Applicant users cannot perform Reviewer actions by calling the API directly.
- Edge-case, regression, and architecture review of the web and API apps, with fixes for input validation, concurrent-transition handling, a shared Prisma client, and frontend audit-trail refresh and DRY cleanups.

What I verified myself:

- I reviewed the data model and status workflow against the assessment requirements.
- I verified that role checks are enforced server-side in NestJS, not only in the frontend.
- I ran the automated tests with `npm test`.
- I ran the production build with `npm run build`.
- I ran local smoke tests against the real database using the seeded Applicant and Reviewer credentials.
- I confirmed audit log entries are created and returned on the application detail response.
