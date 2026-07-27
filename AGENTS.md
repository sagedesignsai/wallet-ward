<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Flowspace — Agent Reference

## What is this?

Flowspace is an AI-first autonomous operations platform. An agent orchestrates work in cloud sandboxes (Daytona), manages secrets via envelope encryption (AES-256-GCM), accesses external services through a vault proxy (zero-leak pattern), and requests human approval for high-risk actions.

## Performance note

This project runs on a standard laptop. CLI commands (especially `pnpm build`, `pnpm dev`, `prisma` operations, and `pnpm install`) may time out with the default 120s limit. Always pass an explicit `timeout` argument when using the `bash` tool — 300000 (5 min) is a safe default, use 600000 (10 min) for builds and installs.

## Quick commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | `prisma generate && next build` (order matters) |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier `**/*.{ts,tsx}` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | `prisma generate` |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:push` | `prisma db push` |
| `pnpm db:studio` | Prisma Studio |

Package manager is **pnpm**. Do not use npm/yarn.

## Build prerequisites

- `prisma generate` outputs to `generated/prisma/` (gitignored, required for builds).
- `pnpm build` already includes `prisma generate`. For a standalone codegen: `pnpm db:generate`.
- Runs automatically on `pnpm install` via `postinstall`.

## Key architectural patterns

**Organization as security boundary** — All resources (projects, secrets, documents, agents) are org-scoped. Encryption keys are org-scoped (one DEK per org). Members have org-wide roles.

**Envelope encryption** — Secrets use AES-256-GCM with unique IV per version. Org DEK is wrapped with `MASTER_KEY` env variable. Generate: `openssl rand -base64 32`.

**Vault proxy (zero-leak)** — Agents never see raw credentials. They call `agentProxy()` which server-side injects tokens from encrypted Integration records. Response never contains the raw token.

**Agent type-based tool access** — Each tool in `lib/ai/tool-access.ts` has an allowed-agent-type list. Four agent types: `coding`, `ops`, `content`, `research`.

**Human-in-the-loop** — High-risk actions go through `ActionProposal` (awaiting_approval → approved → executed/rejected). Agents poll via `getPendingProposals`.

## Database & connections

- Prisma schema: `prisma/schema.prisma`. Driver: PostgreSQL.
- `DATABASE_URL` supports Prisma Accelerate (`prisma://`) or direct Postgres (`postgres://`).
- `DIRECT_DATABASE_URL` is preferred for migrations (falls back to `DATABASE_URL`). See `prisma.config.ts`.
- SSL: `sslmode=require` in the connection string triggers `rejectUnauthorized: false`.

## Entry points

- **App Router**: `app/` — route groups: `(marketing)`, `(auth)`, `dashboard`, `api/`
- **Middleware**: `proxy.ts` — org-routing guard for dashboard routes
- **Auth config**: `lib/auth.ts` — Better Auth with organization, 2FA, API key plugins
- **Prisma client**: `lib/db.ts` — supports both Accelerate and direct PG pool
- **AI model config**: `lib/ai/config.ts` — two providers (OpenCode Zen, OpenRouter)
- **Tool registry**: `lib/ai/tools/` — 25 tools
- **Services**: `lib/services/` — proposals, secrets, tasks, documents, etc.

## Code conventions

- **Path alias**: `@/` maps to project root (`tsconfig.json` paths)
- **Prettier**: no semicolons, double quotes, trailing commas (es5), Tailwind CSS plugin
- **ESLint**: `eslint-config-next` core-web-vitals + typescript
- **shadcn/ui**: components in `@/components/ui/`, configured in `components.json`
- **API errors**: Use helpers from `lib/api/errors.ts` — `badRequest()`, `unauthorized()`, `forbidden()`, `notFound()`, `conflict()`
- **Permissions**: `lib/permissions.ts` — roles: owner, admin, member, viewer

## Agent secret generation

Several env vars require a base64 32-byte key:
```
openssl rand -base64 32
```

Used for: `MASTER_KEY`, `BETTER_AUTH_SECRET`.

## Tests

Test file exists at `__tests__/approval-workflow.integration.test.ts` (imports `@jest/globals`) but no test runner is configured in `package.json`. Tests are not yet runnable.

## Typechecks

Do not run `pnpm typecheck` automatically. Ask first — the user prefers to run typechecks only when an implementation plan is fully complete.

## Architecture docs

`docs/architecture/` contains detailed design documents (data model, agent contract, permissions, decisions, implementation plan). Read `ARCHITECTURE_README.md` first.
