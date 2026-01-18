# Agent Guide for backplane

This repository is a Bun + TypeScript monorepo managed with Turborepo. This file defines how agentic coding tools should work here: how to run builds/tests, and the expected code style and conventions.

---

## Repo Structure

- `apps/api` – Backend API (Bun + Elysia + Prisma)
- `apps/web` – Frontend web app (TypeScript/React-based)
- `packages/eslint-config` – Shared ESLint rules
- `packages/typescript-config` – Shared tsconfig presets
- Root uses Bun workspaces + Turborepo

Node >= 18 is required. Package manager is **Bun** (`bun@1.3.5`).

---

## Install

```bash
bun install
```

Do not use npm or yarn in this repo.

---

## Build / Dev / Lint / Type Check

All top-level commands are orchestrated via Turborepo.

- Build everything:

```bash
bun run build
```

- Dev (all apps, interactive TUI):

```bash
bun run dev
```

- Lint all packages:

```bash
bun run lint
```

- Type-check all packages:

```bash
bun run check-types
```

- Format with Prettier:

```bash
bun run format
```

---

## Running a Single App

### API

```bash
cd apps/api
bun run dev
```

The API runs directly from `src/index.ts` using Bun's watcher.

### Web

The web app is managed via Turborepo. Run from root:

```bash
bun run dev
```

---

## Tests

There is currently **no formal test framework configured**.

- `apps/api` has a placeholder `test` script that always fails
- No Jest / Vitest / Bun test setup exists yet

If you introduce tests:

- Prefer **Vitest** or **Bun test**
- Add package-level scripts (`test`, `test:watch`)
- Ensure single-test execution is possible, e.g.:

```bash
bun test path/to/file.test.ts
```

Do not assume an existing test runner.

---

## Linting & Formatting

### ESLint

Shared configs live in `packages/eslint-config`:

- `base.js` – Core TypeScript rules
- `react-internal.js` – Internal React rules
- `next.js` – Next.js specific rules

Apps should extend one of these configs rather than redefining rules.

### Prettier

- Prettier is the source of truth for formatting
- Run via `bun run format`
- Do not hand-format or fight Prettier output

---

## TypeScript

- TypeScript version: **5.9.x**
- Shared configs in `packages/typescript-config`
- Prefer strict typing; avoid `any`
- Use `unknown` for untrusted inputs and narrow explicitly

### Types

- Shared types often live in `src/lib/types.ts`
- Prefer interfaces for object shapes that may be extended
- Prefer type aliases for unions, primitives, and helpers

---

## Import Conventions

Order imports as:

1. Node built-ins
2. External packages
3. Internal packages (workspace imports)
4. Relative imports

Rules:

- One import per module (no deep destructuring blocks)
- Use named imports over default when available
- Avoid circular dependencies

Example:

```ts
import fs from "node:fs";

import { z } from "zod";
import { Elysia } from "elysia";

import { db } from "../db";
```

---

## Naming Conventions

- files: `kebab-case.ts`
- classes: `PascalCase`
- functions: `camelCase`
- constants: `SCREAMING_SNAKE_CASE` (only for true constants)

Avoid abbreviations unless they are domain-standard.

---

## API & Backend Style (apps/api)

- Framework: **Elysia**
- Prefer small, focused modules
- Controllers handle HTTP concerns only
- Services contain business logic
- Database access is centralized (Prisma / Knex)

### Errors

- Do not throw raw strings
- Use structured error objects
- Prefer explicit error types when possible
- Central error handling lives in `src/errors`

Example:

```ts
throw new Error("Project not found");
```

---

## Database

- Prisma schema lives in `apps/api/prisma/schema.prisma`
- Generate client:

```bash
bun run prisma:generate
```

- Push schema to DB:

```bash
bun run prisma:push
```

Do not edit generated Prisma client files.

---

## Environment Variables

- API uses `.env` in `apps/api`
- Do not commit secrets
- Validate env vars at startup when possible

---

## Git & Hygiene

- Do not reformat unrelated files
- Keep diffs minimal and intentional
- Do not introduce new tooling without discussion

---

## Editor / Agent Rules

- No `.cursor/rules`, `.cursorrules`, or Copilot instruction files are present
- Follow this document as the canonical agent guide

Agents should:

- Prefer existing patterns over inventing new ones
- Ask before large refactors or dependency changes
- Keep code simple, explicit, and readable

---

End of AGENTS.md
