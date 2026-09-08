# Enterprise Collaboration Platform — Backend (Phase 4 Capstone)

A production-shaped NestJS backend for a multi-tenant collaboration platform
(Notion/ClickUp/Jira-style). This repository currently implements the
**Week 1–2 scope**: Authentication, Organizations, Workspaces, and the
foundational database schema. See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md)
for the full 8-week roadmap and [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md)
for branching conventions.

## Tech stack

| Concern        | Choice                          |
|-----------------|----------------------------------|
| Framework       | NestJS 10 (TypeScript)          |
| Database        | PostgreSQL + Prisma ORM         |
| Auth            | JWT (access + rotating refresh) |
| Password hashing| bcrypt                          |
| Validation      | class-validator / class-transformer |
| Docs            | Swagger / OpenAPI (`/docs`)     |
| Testing         | Jest + Supertest                |
| Containerization| Docker Compose                  |
| Queue/Cache (Week 5–6+) | Redis + BullMQ          |

## Architecture

Clean Architecture / SOLID, module-per-domain:

```
src/
  common/            # cross-cutting: guards, decorators, filters, interceptors, enums
  config/            # typed configuration loader
  prisma/            # PrismaService (DB access), global module
  auth/              # register, login, refresh rotation, logout
  users/             # profile / lookup
  organizations/     # org CRUD + membership
  workspaces/        # workspace CRUD + membership, RBAC-guarded routes
```

Controllers contain no business logic — they validate input (DTO +
`ValidationPipe`) and delegate to services. Services own all business rules
and talk to Prisma directly (repository-style access is intentionally kept
thin at this scale; a repository layer can be introduced later without
touching controllers).

### AuthN / AuthZ

- **Authentication**: `JwtAuthGuard` is registered globally (`APP_GUARD`), so
  every route requires a valid access token unless explicitly marked
  `@Public()` (used by `register`, `login`, `refresh`).
- **Authorization**: workspace-level RBAC (`OWNER > ADMIN > MEMBER > VIEWER`)
  is enforced by `RolesGuard` + `@Roles(...)`, scoped to a `:workspaceId`
  route param. Organization-level authorization is checked directly in
  `OrganizationsService` since organization routes don't carry a workspace id.
- **Refresh tokens** are never stored raw — only a bcrypt hash — and rotate on
  every use (the presented token is revoked when a new pair is issued).

### Error & response shape

- Every error response is normalized by `GlobalExceptionFilter`:
  `{ success: false, statusCode, path, timestamp, message, error? }`
- Every success response is wrapped by `TransformInterceptor`:
  `{ success: true, statusCode, data }`

## Getting started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### 1. Environment
```bash
cp .env.example .env
# fill in JWT_ACCESS_SECRET / JWT_REFRESH_SECRET with long random values
```

### 2. Start dependencies (Postgres + Redis)
```bash
docker compose up -d postgres redis
```

### 3. Install & migrate
```bash
npm install
npm run prisma:migrate      # creates tables from prisma/schema.prisma
npm run prisma:seed         # optional: creates demo org/workspace/users
```

### 4. Run the API
```bash
npm run start:dev
```
- API base: `http://localhost:3000/api/v1`
- Swagger:  `http://localhost:3000/docs`

Or run everything (API included) in containers:
```bash
docker compose up --build
```

### 5. Tests
```bash
npm run test          # unit tests
npm run test:cov       # unit tests + coverage report
npm run test:e2e       # e2e (requires DB reachable via DATABASE_URL)
```

## Seeded demo accounts
| Email             | Password           | Role in "Demo Organization" |
|-------------------|---------------------|------------------------------|
| owner@ecp.dev     | Str0ngP@ssword!     | OWNER                        |
| member@ecp.dev    | Str0ngP@ssword!     | MEMBER                       |

## API surface (Week 1–2)

**Auth** (`/api/v1/auth`)
- `POST /register` — create account, returns token pair
- `POST /login` — returns token pair
- `POST /refresh` — rotates a refresh token
- `POST /logout` — revokes the presented refresh token

**Users** (`/api/v1/users`)
- `GET /me` — caller's profile
- `GET /lookup?email=` — find a user to invite
- `GET /:id` — profile by id

**Organizations** (`/api/v1/organizations`)
- `POST /` · `GET /` · `GET /:id` · `PATCH /:id` · `POST /:id/archive` · `DELETE /:id`
- `POST /:id/members` — invite/update a member's org role

**Workspaces** (`/api/v1/workspaces`)
- `POST /` · `GET /` · `GET /:workspaceId` · `PATCH /:workspaceId` (ADMIN+)
- `POST /:workspaceId/archive` (OWNER) · `DELETE /:workspaceId` (OWNER)
- `POST /:workspaceId/members` (ADMIN+)

Full request/response schemas are in Swagger at `/docs` once the server is running.

## Security checklist implemented this phase
- [x] Passwords hashed with bcrypt (cost factor 12), never logged or returned
- [x] JWT access tokens short-lived (15m default); refresh tokens rotate and are hashed at rest
- [x] Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` (rejects unexpected fields)
- [x] `helmet()` security headers
- [x] Global rate limiting via `@nestjs/throttler`
- [x] Generic "invalid email or password" message (no user-enumeration via login)
- [x] Organization/workspace lookups return 404 (not 403) to non-members, avoiding ID enumeration
- [x] RBAC enforced server-side on every mutating route, never trusted from the client

## Roadmap
See [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) for Weeks 3–8 (Projects/Tasks/Comments,
Notifications, BullMQ, Redis caching, Audit Logs, testing hardening, and all
requested bonus features).
