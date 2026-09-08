# Git Workflow Guide

Follows the requirement doc's Section 18 (`main` / `develop` / `feature/*` /
`bugfix/*`), applied concretely to this project.

## Branch model

| Branch            | Purpose                                              | Protected |
|--------------------|-------------------------------------------------------|-----------|
| `main`             | Always deployable. Only receives merges from `develop` at milestone boundaries (end of each week/phase). | Yes |
| `develop`          | Integration branch. All feature/bugfix branches merge here first. | Yes |
| `feature/<slug>`   | One feature = one branch, cut from `develop`.         | No |
| `bugfix/<slug>`    | One bug fix = one branch, cut from `develop` (or from `main` for a hotfix, see below). | No |

Naming: lowercase, hyphen-separated, prefixed by scope, e.g.
`feature/auth-jwt-refresh-rotation`, `bugfix/workspace-slug-collision`.

## One-time setup
```bash
git init
git checkout -b main
git add .
git commit -m "chore: initial project scaffold (NestJS, Prisma, Docker)"
git checkout -b develop
git push -u origin main
git push -u origin develop
```
From here on, `main` and `develop` are protected in the remote (GitHub:
Settings → Branches → require PR + at least 1 review + passing CI before
merge — set this up once GitHub Actions CI lands in Week 7–8, manually review
until then).

## Feature branches for Week 1–2 (this delivery)

Cut one branch per feature area, in this order, each merged back to `develop`
via its own PR before the next begins (keeps diffs reviewable):

```bash
git checkout develop
git checkout -b feature/project-scaffold-and-tooling
# package.json, tsconfig, nest-cli, eslint/prettier, .env.example, .gitignore
git add .
git commit -m "chore: scaffold NestJS project with lint/format/test tooling"
git push -u origin feature/project-scaffold-and-tooling
# open PR: feature/project-scaffold-and-tooling -> develop

git checkout develop
git checkout -b feature/database-schema-prisma
# prisma/schema.prisma, prisma/seed.ts, docker-compose.yml (postgres)
git add .
git commit -m "feat(db): add Prisma schema for full ER model and seed script"
git push -u origin feature/database-schema-prisma
# open PR: feature/database-schema-prisma -> develop

git checkout develop
git checkout -b feature/common-http-layer
# src/common/** (guards, decorators, filters, interceptors), src/prisma/**
git add .
git commit -m "feat(common): add global exception filter, RBAC guard, decorators"
git push -u origin feature/common-http-layer
# open PR: feature/common-http-layer -> develop

git checkout develop
git checkout -b feature/auth-module
# src/auth/**
git add .
git commit -m "feat(auth): register/login with bcrypt + rotating JWT refresh tokens"
git push -u origin feature/auth-module
# open PR: feature/auth-module -> develop

git checkout develop
git checkout -b feature/users-module
git add .
git commit -m "feat(users): profile lookup endpoints"
git push -u origin feature/users-module
# open PR: feature/users-module -> develop

git checkout develop
git checkout -b feature/organizations-module
git add .
git commit -m "feat(organizations): CRUD + membership with role-based authorization"
git push -u origin feature/organizations-module
# open PR: feature/organizations-module -> develop

git checkout develop
git checkout -b feature/workspaces-module
git add .
git commit -m "feat(workspaces): CRUD + membership with RolesGuard enforcement"
git push -u origin feature/workspaces-module
# open PR: feature/workspaces-module -> develop

git checkout develop
git checkout -b feature/testing-and-docs
# test/**, docs/**, README.md
git add .
git commit -m "test: add auth/organizations unit tests and auth e2e flow"
git push -u origin feature/testing-and-docs
# open PR: feature/testing-and-docs -> develop
```

At the end of Week 2, once `develop` is green:
```bash
git checkout main
git merge --no-ff develop -m "release: Week 1-2 - Auth, Organizations, Workspaces, DB"
git tag -a v0.2.0 -m "Week 1-2 milestone"
git push origin main --tags
```

## Bugfix branches

Bugs found during development of a later feature but belonging to an already
merged feature get their own branch off `develop`:
```bash
git checkout develop
git checkout -b bugfix/refresh-token-not-revoked-on-logout
git commit -m "fix(auth): revoke refresh token row on logout instead of soft no-op"
git push -u origin bugfix/refresh-token-not-revoked-on-logout
# open PR: bugfix/... -> develop
```

**Hotfix exception**: if a bug is discovered in `main` (already released),
branch from `main` instead of `develop`, merge back to **both** `main` and
`develop`:
```bash
git checkout main
git checkout -b bugfix/prod-jwt-expiry-crash
git commit -m "fix(auth): guard against malformed JWT_ACCESS_EXPIRES_IN value"
git push -u origin bugfix/prod-jwt-expiry-crash
# PR -> main, then separately merge main back into develop
```

## Commit message convention

Conventional Commits, so history and (later) changelog generation stay
meaningful:
```
<type>(<scope>): <short summary>

type: feat | fix | chore | docs | test | refactor | perf | ci
scope: auth | organizations | workspaces | users | db | common | docs
```
Examples already used above. Keep the summary under ~72 chars; add a body
paragraph for anything non-obvious (why, not just what).

## Pull Request description template

Save as `.github/pull_request_template.md` (create this file once the repo is
pushed to GitHub) so every PR pre-fills with:

```markdown
## Summary
What does this PR do, in 1-3 sentences?

## Related requirement doc section(s)
e.g. Section 9 (Authentication & Authorization), Section 10 (Feature Requirements - Workspace)

## Changes
- ...
- ...

## Testing
- [ ] Unit tests added/updated
- [ ] Manually verified via Swagger (`/docs`)
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

## Security considerations
Anything touching auth, RBAC, input validation, or data exposure - call it out explicitly.

## Screenshots / sample requests (optional)
```

Even when working solo without an actual reviewer, write the PR description
before merging — it's the artifact the requirement doc's evaluation criteria
("Git History", "Communication & Ownership") actually grades.

## Branch cleanup
```bash
git branch -d feature/<slug>          # after merge, locally
git push origin --delete feature/<slug>
```
