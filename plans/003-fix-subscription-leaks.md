# Plan 003: Fix Firebase subscription leaks

> **Drift check**: `git diff --stat 2d919e3..HEAD -- components/room-list.tsx app/room/[RoomID]/page.tsx`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `2d919e3`, 2026-07-11

## Why this matters

Two Firebase `onValue` subscriptions are started but never cleaned up:

1. `RoomList` calls `GetRoomsFromFirebase` and discards the returned unsubscribe function. Every component remount adds a new listener to the Firebase connection.
2. `RoomPage` stores `loadMessages`'s unsubscribe return value nowhere. Navigating between rooms accumulates listeners; the old room's messages keep streaming in.

Both leaks cause memory growth, spurious state updates on unmounted components (React "can't perform state update on unmounted component" warnings), and unnecessary Firebase bandwidth.

## Current state

`components/room-list.tsx:34-38`:
```tsx
useEffect(() => {
  GetRoomsFromFirebase((r) => setRooms(r))
}, [])
```
The return value (unsubscribe function) is dropped.

`app/room/[RoomID]/page.tsx` — `loadMessages` useCallback:
```tsx
const loadMessages = useCallback(() => {
  if (user && roomId) {
    setIsPasswordValid(true)
    const unsubscribe = GetMessagesFromFirebase(roomId, (msgs) => { ... })
    return unsubscribe   // returned but callers ignore it
  }
}, [user, roomId])
```
`loadMessages()` is called without capturing its return value. No cleanup runs on unmount or room change.

## Commands

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npx tsc --noEmit` | exit 0 |

## Scope

**In scope**: `components/room-list.tsx`, `app/room/[RoomID]/page.tsx`
**Out of scope**: everything else

## Steps

### Step 1: Fix `components/room-list.tsx`

Return the unsubscribe from the `useEffect` so React calls it on unmount:

```tsx
useEffect(() => {
  return GetRoomsFromFirebase((r) => setRooms(r))
}, [])
```

**Verify**: `npx tsc --noEmit` → exit 0

### Step 2: Fix `app/room/[RoomID]/page.tsx`

Add a `useRef` to store the active subscription, clean it up on unmount, and cancel it before starting a new one inside `loadMessages`:

1. Add near the top of the component (alongside existing state declarations):
```tsx
const messagesUnsubRef = useRef<(() => void) | undefined>(undefined)
```

2. Add a cleanup effect (once, on unmount):
```tsx
useEffect(() => {
  return () => { messagesUnsubRef.current?.() }
}, [])
```

3. Inside `loadMessages`, cancel the previous subscription before starting a new one and store the new one:
```tsx
const loadMessages = useCallback(() => {
  if (user && roomId) {
    messagesUnsubRef.current?.()   // cancel previous if any
    setIsPasswordValid(true)
    messagesUnsubRef.current = GetMessagesFromFirebase(roomId, (msgs) => {
      setMessages(msgs)
      setIsLoading(false)
    })
  }
}, [user, roomId])
```

Remove the `return unsubscribe` line from `loadMessages` — it is no longer needed since the ref handles cleanup.

**Verify**: `npx tsc --noEmit` → exit 0

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `grep -n "GetRoomsFromFirebase" components/room-list.tsx` shows a `return` before the call
- [ ] `grep -n "messagesUnsubRef" app/room/[RoomID]/page.tsx` shows the ref declaration, cleanup effect, and usage in `loadMessages`
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

- The `loadMessages` function is called from more than the two call sites visible in the current file (search before editing).

## Maintenance notes

- If the message subscription is ever moved to a custom hook, carry the `useRef` cleanup pattern with it.
