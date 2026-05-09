# BTI Smart Attendance Monitoring System

A full-stack smart attendance tracking platform for Bangalore Technological Institute — managing students, subjects, and attendance across 7 engineering branches with analytics and printable reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, Recharts, next-themes (dark/light mode)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Replit Auth (OpenID Connect / PKCE)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema files (branches, subjects, students, attendance, auth)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/attendance-app/src/` — React frontend
- `artifacts/attendance-app/src/lib/binary-search.ts` — Binary search utility (O(log n))
- `artifacts/attendance-app/public/bti-logo.jpeg` — BTI college logo

## Architecture decisions

- Contract-first: OpenAPI spec drives both React Query hooks and Zod validators via Orval codegen
- Replit Auth used instead of local JWT — cleaner, production-grade OIDC with PKCE
- PostgreSQL (Drizzle ORM) instead of MongoDB — already provisioned, better type safety
- Binary search implemented client-side in a utility module with sorted arrays for O(log n) student lookup
- Bulk attendance submission: single POST with array of records for efficient take-attendance flow

## Product

- Login with Replit Auth (faculty/admin)
- Dashboard: stats cards, 30-day trend chart, branch-wise bar chart, subject stats
- Branch management: CRUD for 7 branches (CSE, AIML, CE, CIVIL, MECHANICAL, ISE, CSDS)
- Subject management: branch-specific subjects with CRUD
- Student management: search/filter by branch/year/section, binary search by ID or name
- Attendance: take attendance (bulk mark), view/filter records, pagination
- Reports: printable attendance reports with BTI branding, export to CSV/PDF

## User preferences

- Empty database by default — no seed data, everything created dynamically
- Replit Auth for secure admin login
- BTI college branding throughout (logo, college name, affiliations)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing openapi.yaml
- Always run `pnpm --filter @workspace/db run push` after changing DB schema files
- `replit-auth-web` must be in both root tsconfig.json references AND the attendance-app tsconfig.json references

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/replit-auth/SKILL.md` for auth architecture
