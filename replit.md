# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

This is the RecycleRight Pakistan project. Three runnable artifacts plus shared libs:

- `artifacts/api-server` — Express 5 API (port 8080)
- `artifacts/collector` — RecycleRight Collector mobile app (Expo, port 3000)
- `artifacts/mockup-sandbox` — Vite UI prototyping sandbox (port 5173, base `/__mockup/`)
- `artifacts/household` — incomplete; only loose `components/`, `screens/`, `data/`, `navigation/` files (no `package.json` or `artifact.toml`). Not wired into the workspace.

### Running locally (workflows)

| Workflow | Command |
|---|---|
| API Server | `PORT=8080 pnpm --filter @workspace/api-server run dev` |
| Collector App | `PORT=3000 pnpm --filter @workspace/collector run dev` |
| Mockup Sandbox | `PORT=5173 BASE_PATH=/__mockup/ pnpm --filter @workspace/mockup-sandbox run dev` |

Note: the `artifact.toml` files exist on disk but the artifacts are not registered in the workspace artifact registry, so previews are accessed via the workflow webview (Collector App) rather than the artifact dropdown.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
