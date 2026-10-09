# Mini Task Tracker

React (TypeScript, Vite) + Node.js (Express, TypeScript) + PostgreSQL.

> **Database note:** the brief says "Postgres SQL" in the header but "MongoDB" in requirement 7.
> I treated that as a typo and built on **PostgreSQL**, which the header names as the stack.

## Setup

Prerequisites: Node 20+, a running PostgreSQL instance.

```bash
# 1. create a database
psql -U postgres -c "CREATE DATABASE task_tracker;"

# 2. install (npm workspaces: installs server + client)
npm install

# 3. configure the server
cp server/.env.example server/.env     # then set DATABASE_URL

# 4. run (two terminals)
npm run dev:server    # API on http://localhost:4000 (creates the table on boot)
npm run dev:client    # UI  on http://localhost:5173 (proxies /api -> :4000)
```

## Tests

```bash
npm test
```

Server tests use supertest against the real Express app and an **in-memory Postgres (pg-mem)**,
so no database is needed to run them. They cover invalid task creation and a successful status
update (plus 404/400 handling, delete, and filtering).

## API

| Method | Path                 | Body / query                                  | Success                     |
| ------ | -------------------- | --------------------------------------------- | --------------------------- |
| POST   | `/tasks`             | `{ title, description?, status?, priority? }` | `201` task                  |
| GET    | `/tasks?status=Done` | optional `status`                             | `200` task[] (newest first) |
| PATCH  | `/tasks/:id`         | `{ status }`                                  | `200` task                  |
| DELETE | `/tasks/:id`         | –                                             | `204`                       |

Errors always look like:

```json
{
  "error": "Validation failed",
  "details": [{ "field": "title", "message": "Title is required" }]
}
```

Status codes: 400 invalid input, 404 not found, 500 anything else.

## Technical decisions

- **Validation in layers:** zod at the API boundary (trims title, 1–100 chars, enum checks,
  rejects unknown fields), plus `CHECK` constraints in the schema as a backstop. The UI shows
  the server's per-field messages next to the inputs.
- **`createApp(repository)` factory:** the app takes its repository as a parameter, so tests
  inject an in-memory DB without mocking.
- **Repository layer** keeps SQL out of route handlers; all queries are parameterised.
- **UUID ids** generated in the app (no extension needed in Postgres).
- **Client re-fetches after each mutation** rather than patching local state: always consistent
  with the server and the active filter, at the cost of one extra request.
- **Delete confirmation** is an inline confirm/cancel in the task card (accessible, testable),
  not `window.confirm`.
- **UI states:** loading, empty (different copy for filtered vs. no tasks), error with retry,
  and a banner for failed actions.

## Authentication & access restrictions (production)

- Add a `users` table and a `user_id` FK on `tasks`; every query filters by the authenticated
  user (`WHERE user_id = $1`) so users can never read or modify others' tasks. Return 404 (not 403) for other users' ids to avoid leaking existence.
- Authenticate with either a managed provider (Auth0/Cognito/Clerk, validating JWTs in an Express
  middleware) or sessions in an `HttpOnly; Secure; SameSite=Lax` cookie with CSRF protection.
  Hash passwords with argon2 if self-hosting.
- Authorisation: roles (e.g. `member`, `admin`) checked in middleware; a team model would add
  `team_id` scoping.
- Hardening: HTTPS only, `helmet`, `express-rate-limit` (stricter on login), locked-down CORS
  origin, secrets from a secret manager, audit logging.

## Assumptions

- Statuses default to "To Do" and priority to "Medium" when omitted.
- Only status is editable after creation (per the brief).
- Titles are trimmed; descriptions capped at 2000 chars (my choice, the brief sets no limit).

## Limitations / with more time

- No pagination (list returns all tasks).
- Schema is created with `CREATE TABLE IF NOT EXISTS` on boot; I'd use a migration tool
  (node-pg-migrate / Prisma Migrate).
- pg-mem is not real Postgres; I'd add a CI job running the same suite against a Postgres
  container.
- No client-side tests (e.g. React Testing Library for the form error and confirm flows) or e2e
  (Playwright).
- Editing title/description/priority, optimistic updates, and filtering by priority.
- No Dockerfile / docker-compose for one-command setup.
