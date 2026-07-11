# Plan 005: Remove unused dependencies and dead code

> **Drift check**: `git diff --stat 2d919e3..HEAD -- package.json app/contact utils components/ui/table.tsx`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `2d919e3`, 2026-07-11

## Why this matters

Seven production dependencies are installed and never imported: Redux stack (`@reduxjs/toolkit`, `react-redux`, `redux-logger`), the abandoned Neon/PostgreSQL migration path (`@neondatabase/serverless`, `pg`), and low-level Node packages (`ws`, `dotenv`). They inflate the npm audit surface, slow installs, and can trigger false-positive vulnerability alerts. Three dead files also exist: a non-functional contact page, a one-time migration script (containing a hardcoded default password `"password123"` in a log statement), and an unused shadcn table component.

## Current state

`package.json` — confirmed unused via grep:
- `@reduxjs/toolkit`, `react-redux`, `redux-logger`, `@types/redux-logger` — zero imports in source
- `@neondatabase/serverless`, `pg`, `@types/pg` — zero imports in source
- `ws`, `@types/ws` — zero imports in source
- `dotenv` — zero imports in source

Dead files (confirmed — no other file imports them):
- `app/contact/page.tsx` — renders a non-functional form; no link to `/contact` anywhere in the app
- `utils/migrate-rooms.ts` — one-time migration script; no longer needed; contains `console.log("Default password for all rooms: ${DEFAULT_PASSWORD}")` where `DEFAULT_PASSWORD = "password123"`
- `components/ui/table.tsx` — shadcn component; only file that references it is itself

## Commands

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | exit 0 |

## Scope

**In scope**: `package.json`, `app/contact/page.tsx` (delete), `utils/migrate-rooms.ts` (delete), `utils/` directory (delete if empty), `components/ui/table.tsx` (delete)
**Out of scope**: `pnpm-lock.yaml` regenerated automatically; do not edit it manually

## Steps

### Step 1: Remove dead source files

Delete:
- `app/contact/page.tsx`
- `utils/migrate-rooms.ts`
- `utils/` directory (after deleting migrate-rooms.ts, the directory is empty)
- `components/ui/table.tsx`

**Verify**: `npx tsc --noEmit` → exit 0 (confirms nothing imported these)

### Step 2: Remove unused packages from `package.json`

From `dependencies`, remove:
- `@reduxjs/toolkit`
- `@neondatabase/serverless`
- `pg`
- `react-redux`
- `redux-logger`
- `ws`
- `dotenv`

From `devDependencies`, remove:
- `@types/redux-logger`
- `@types/pg`
- `@types/ws`

### Step 3: Verify

```
npx tsc --noEmit
npx next build
```

Both must exit 0.

## Done criteria

- [ ] `app/contact/page.tsx` does not exist
- [ ] `utils/migrate-rooms.ts` does not exist
- [ ] `components/ui/table.tsx` does not exist
- [ ] `grep -n "redux\|neondatabase\|\"pg\"\|\"ws\"\|dotenv" package.json` returns no matches in the dependencies sections
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

- `npx tsc --noEmit` emits errors after deletions (a file you thought was unused is actually imported somewhere).
- Any of the packages to remove appear in import statements found by: `grep -rn "redux\|neondatabase\|from 'pg'\|from 'ws'\b" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`

## Maintenance notes

- The README still mentions Drizzle ORM and PostgreSQL as part of the stack — update README after this plan lands to reflect that the Firebase-only path is current.
