# Plan 002: Move Firebase config to environment variables

> **Drift check**: `git diff --stat 2d919e3..HEAD -- lib/db.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW — purely a configuration refactor; runtime behavior is identical
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `2d919e3`, 2026-07-11

## Why this matters

`lib/db.ts:8-17` has Firebase project credentials (apiKey, databaseURL, projectId, etc.) hardcoded as string literals and committed to the public GitHub repository. These values can never be truly rotated without creating a new Firebase project. Moving them to `NEXT_PUBLIC_` environment variables follows the intended pattern (the comment in the file says "in a real app, use environment variables") and makes the repo safe to fork.

## Current state

- `lib/db.ts:8-17` — `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }` with literal string values
- No `.env.example` file exists in the repo root
- `.gitignore` already excludes `.env` and `.env*.local` (confirmed)

## Commands

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | exit 0 |

## Scope

**In scope**: `lib/db.ts`, `.env.local` (new, gitignored), `.env.example` (new, committed)
**Out of scope**: everything else

## Steps

### Step 1: Create `.env.local` with the current credential values

Create the file at repo root. It will not be committed (covered by `.env*.local` in `.gitignore`). The variable names to use:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```
Fill in the actual values from `lib/db.ts:9-16` (read the file — do not store the values anywhere that will be committed).

### Step 2: Create `.env.example` with placeholder values

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Update `lib/db.ts`

Replace the hardcoded `firebaseConfig` object with environment variable reads. Remove the comment about "in a real app". The `measurementId` field (analytics) can be dropped — it is not used anywhere in the codebase.

**Verify**: `npx tsc --noEmit` → exit 0, `npx next build` → exit 0

## Done criteria

- [ ] `grep -n "AIzaSy" lib/db.ts` returns no matches
- [ ] `grep -n "firebaseapp.com" lib/db.ts` returns no matches
- [ ] `.env.example` exists and has all 7 variable names as placeholders
- [ ] `.env.local` exists, is gitignored, and has actual values
- [ ] `npx next build` exits 0
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

- `lib/db.ts` uses any env var name other than `NEXT_PUBLIC_*` — Next.js requires this prefix for browser-accessible vars.

## Maintenance notes

- When deploying to Vercel, add all 7 `NEXT_PUBLIC_*` variables in the Vercel project settings.
- Anyone forking the repo needs to create their own `.env.local` using `.env.example` as a template.
