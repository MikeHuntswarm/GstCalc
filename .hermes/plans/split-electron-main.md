# #6 — Split electron/main.ts + extract security policy

**Goal:** 169-line `electron/main.ts` bundles window creation, navigation security, auto-update, and IPC. The security guards (most important code) are untested. Extract the URL-allowlist decision into a testable pure function, then split the concerns.

## New pure module

| File                   | Contents                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `electron/security.ts` | `shouldOpenExternally(url): boolean` — http/https only, false for file:/javascript:/invalid |

## New modules (split from main.ts)

| File                  | Contents                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| `electron/window.ts`  | `createMainWindow()` — window + navigation guards (uses `shouldOpenExternally`)     |
| `electron/updater.ts` | `setupAutoUpdates(mainWindow)`                                                      |
| `electron/ipc.ts`     | `registerIpcHandlers()` — notifications (rate-limited), relaunch, check-for-updates |

`main.ts` becomes a thin bootstrap: `app.whenReady()` → create window, setup updater, register IPC.

## Fixes during split

- **Dead `GH_TOKEN` branch**: repo is public (`private: false`), token never needed. Remove the branch; keep a plain `setFeedURL` with no token.
- **Mutable `let` rate-limit closure**: move the cooldown state into the ipc module scope (still a closure, but isolated to one concern).

## Tests

- `electron/security.test.ts` — http/https true; file:, javascript:, data:, invalid → false

## Verify

- `npx tsc -p electron/tsconfig.json` (electron has its own tsconfig), `npx vitest run` (155 + new)
- Commit; stop at boundary.
