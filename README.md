# Submission & Approval Workflow

A small two-sided assessment app for application submission and reviewer approval.
The core is a backend-enforced status workflow with an audit trail.

## Stack

- Frontend: Next.js, TypeScript, Better Auth React client
- Backend: NestJS, TypeScript, Better Auth, Prisma
- Database: PostgreSQL
- Tests: Jest unit tests and a Nest/Supertest authorization test

## Local Setup

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

Seeded accounts:

- Applicant: `applicant@example.com` / `password123`
- Reviewer: `reviewer@example.com` / `password123`

## Data Model

The Better Auth tables are `user`, `session`, `account`, and `verification`.
The domain tables are:

- `Application`: owner, form fields, status, timestamps
- `ApplicationAuditLog`: actor, old status, new status, comment, timestamp

Application statuses are:

```txt
DRAFT
SUBMITTED
UNDER_REVIEW
APPROVED
REJECTED
RETURNED
```

## Workflow Rules

- Applicants can create drafts.
- Only the owner can edit a draft.
- Applicants can submit `DRAFT -> SUBMITTED`.
- Reviewers can move `SUBMITTED` or `UNDER_REVIEW` to review outcomes.
- Rejecting or returning requires a comment.
- Returned applications must be reopened as `DRAFT` before editing, preserving the rule that applicants only edit drafts.
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

- `GET /api/review/applications?status=SUBMITTED`
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

## Trade-offs

- File attachments were intentionally excluded because they are optional and would add storage/deployment complexity without strengthening the core workflow.
- The form is deliberately simple so the implementation effort stays focused on status correctness, authorization, and auditability.
- Returned applications are reopened to `DRAFT` before editing. This keeps the assessment rule "applicants only edit drafts" intact while still supporting a revision loop.
- The reviewer queue includes status filtering. Pagination/search can be added later if the queue grows.

## AI Usage

- Codex (ChatGPT 5.5) was used for frontend design and implementation.
- Claude was used for backend logic, code cleanup, review, and tests.

All generated code was reviewed and verified through the documented tests and local workflow before submission.
