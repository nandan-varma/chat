# Plan 001: Fix encryption — plaintext fallback, fixed PBKDF2 salt, weak password hash

> **Executor instructions**: Follow step by step. Run every verification command and confirm the expected result before proceeding. Honor STOP conditions.
>
> **Drift check**: `git diff --stat 2d919e3..HEAD -- lib/encryption.ts components/send-message.tsx components/message-view.tsx`
> If any of those files changed since this plan was written, compare the "Current state" excerpts against live code before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED — changes the encryption key derivation (fixed salt → room-ID salt) and password hash algorithm; all existing encrypted messages and room passwords become invalid. Acceptable for an alpha project; note this in the commit message.
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `2d919e3`, 2026-07-11

## Why this matters

Three compounding weaknesses in `lib/encryption.ts` undermine the core promise of encrypted chat:

1. `encryptMessage` catches all errors and silently returns plaintext — a user believes their message is encrypted when it is not.
2. `generateKeyFromPassword` uses a hardcoded salt `'chat-room-salt'` for PBKDF2. Two rooms using the same password derive the identical AES-256 key, defeating per-room key isolation.
3. `createPasswordHash` uses plain SHA-256 with a fixed salt `'room-password-salt'` — fast to brute-force and vulnerable to rainbow-table attacks.

## Current state

- `lib/encryption.ts:9` — `generateKeyFromPassword(password, salt = 'chat-room-salt')` uses a constant default
- `lib/encryption.ts:71` — `encryptMessage` catch block: `return plaintext; // Fallback to plaintext on error`
- `lib/encryption.ts:130-135` — `createPasswordHash` calls `crypto.subtle.digest('SHA-256', encoder.encode(password + 'room-password-salt'))`
- `components/send-message.tsx:43` — `content = await encryptMessage(content, password)` (2 args)
- `components/message-view.tsx:53` — `setContent(await decryptMessage(msg.content, password))` (2 args)
- `components/message-view.tsx:86-87` — roomId extracted: `window.location.pathname.split('/').pop() ?? ''`

## Commands

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0, no errors |
| Build | `npx next build` | exit 0 |

## Scope

**In scope**: `lib/encryption.ts`, `components/send-message.tsx`, `components/message-view.tsx`
**Out of scope**: everything else — do not change Firebase DB structure or the room page.

## Steps

### Step 1: Rewrite `lib/encryption.ts`

Replace the entire file with the version below. Key changes:
- `generateKeyFromPassword(password, roomId)` — roomId is now required, used as the PBKDF2 salt prefix
- `encryptMessage(plaintext, password, roomId)` — throws on failure instead of returning plaintext
- `decryptMessage(ciphertext, password, roomId)` — throws on failure
- `createPasswordHash(password)` — replaced SHA-256 one-shot with PBKDF2 (100k iterations)

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Update `components/send-message.tsx`

At line 43, pass `room_id` as the third argument:
```ts
content = await encryptMessage(content, password, room_id)
```
`room_id` is a prop already available in scope.

**Verify**: `npx tsc --noEmit` → exit 0

### Step 3: Update `components/message-view.tsx`

At line 53, pass the `roomId` (already extracted at line 86-87) as the third argument:
```ts
setContent(await decryptMessage(msg.content, password, roomId))
```
`roomId` is already in scope from `window.location.pathname`.

**Verify**: `npx tsc --noEmit` → exit 0

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n "Fallback to plaintext" lib/encryption.ts` returns no matches
- [ ] `grep -n "chat-room-salt" lib/encryption.ts` returns no matches
- [ ] `grep -n "room-password-salt" lib/encryption.ts` returns no matches
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

- Code at cited locations doesn't match the excerpts above.
- Changing `encryptMessage` or `decryptMessage` signature requires touching files outside the in-scope list.

## Maintenance notes

- Existing encrypted messages stored in Firebase will be undecryptable after this change (different PBKDF2 salt). Existing room passwords will also fail verification (new hash algorithm). This is a known and accepted breaking change for the alpha.
- If message format is ever extended (e.g. to include a version byte), revisit the salt strategy — the room-ID salt is still a fixed string per room, not per-message.
