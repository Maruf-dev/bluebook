# ExamDesk (bluebook)

Desktop app for timed Digital SAT–style practice tests. Electron + React + Vite + SQLite (better-sqlite3).

## Development

```bash
npm install        # also rebuilds better-sqlite3 for Electron (postinstall)
npm run dev        # Vite dev server + Electron with --dev
npm run typecheck  # renderer + main process
npm test           # vitest unit / flow tests
npm run dist:win   # Windows x64 NSIS installer -> release/
```

## Layout

- `src/main` — Electron main process: window, SQLite database and migrations, IPC handlers
- `src/preload` — sandboxed preload exposing `window.examDeskAPI.invoke` for an allow-listed set of channels
- `src/renderer` — React UI (HashRouter, zustand stores, pages)
- `src/shared` — types, constants and pure exam logic (scoring, validation) used by both processes
- `src/shared/content/sample-test.json` — bundled sample test, seeded on startup

## Test file format

Import tests from Home → Import Test. A file needs `metadata` (`id`, `title`, …), `sections`
(`id`, `name`, `type`, `module`, `durationMinutes`, …) and `questions`. Multiple-choice questions have
`options` with one `isCorrect: true`; student-produced responses have `answer` (alternatives separated
by `|`, e.g. `"1/2|0.5"`). Math can be written inline as `\( … \)` or as display `\[ … \]`.

Scores are a linear practice estimate (200–800 per section), not an official SAT conversion.
