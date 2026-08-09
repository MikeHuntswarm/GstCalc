# System Log

## dependency: Electron Setup

**Configured Electron ^38.8.6 with React 19.**

- Electron 38.8.6 (CI-compatible, Node 20+)
- React 19.1.1, Vite 7, Zustand 5, Zod 4
- Auto-updater targets public GitHub releases
- Build workflow: `npm install` → `npm run build` → `npm run package`
- Pre-commit: Husky + lint-staged (ESLint + Prettier)
- Electron config: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`

Log time: 2026-07-09T18:51:24.768Z
