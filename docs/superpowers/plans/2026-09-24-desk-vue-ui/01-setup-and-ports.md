# Part 1. Build setup + pure ports (Tasks 1–2)

Index, Global Constraints, Review Focus: `../2026-09-24-desk-vue-ui.md`. Spec: `docs/superpowers/specs/2026-09-24-desk-vue-ui-design.md`.

---

### Task 1: Vendor `tn-uikit`, Vite/`vue-tsc` build setup, `tokens.css`

**Files:**
- Create: `ui/vendor/tn-uikit/` (extracted from repo-root `uikit-master.zip`)
- Modify: `package.json` (root), `ui/vite.config.ts`, `ui/tsconfig.json`
- Create: `ui/src/main.ts`, `ui/src/App.vue` (loading-state skeleton only — full wiring is Task 7)
- Create: `ui/src/styles/tokens.css`
- Delete: `ui/src/main.tsx` (replaced by `main.ts`)

**Interfaces:**
- Consumes: `@life_uikit/uikit` (vendored), the existing unchanged `src/http` server (dev proxy target)
- Produces: a Vite build that boots a blank Vue app showing "Загрузка доски…" against the real `desk ui` dev server; every later task builds on this shell

- [ ] **Step 1: Extract the kit into the repo**

```bash
mkdir -p ui/vendor
unzip -q uikit-master.zip -d /tmp/tn-uikit-extract
mv /tmp/tn-uikit-extract/uikit-master ui/vendor/tn-uikit
rm -rf /tmp/tn-uikit-extract uikit-master.zip
```

Verify: `cat ui/vendor/tn-uikit/package.json | grep -E '"name"|"version"'` prints `"name": "@life_uikit/uikit"` and `"version": "7.0.2"`. If it doesn't match, stop and report NEEDS_CONTEXT — a different kit version changes every prop reference in later tasks.

- [ ] **Step 2: Update root `package.json`**

Remove: `@dnd-kit/core`, `@fontsource/ibm-plex-sans` (keep `@fontsource/ibm-plex-mono` — still used for the monospace accent per spec §7), `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `react`, `react-dom`.

Add to `devDependencies`:
```json
"@vitejs/plugin-vue": "^6.0.4",
"vue": "^3.5.0",
"vue-tsc": "^3.2.4",
"vue-draggable-plus": "^0.5.0",
"@life_uikit/uikit": "file:ui/vendor/tn-uikit",
"@floating-ui/vue": "^1.0.6",
"click-outside-vue3": "^4.0.1",
"maska": "^3.0.0",
"overlayscrollbars": "^2.11.5",
"overlayscrollbars-vue": "^0.5.9",
"vue3-touch-events": "^4.1.0"
```
(Version numbers match `ui/vendor/tn-uikit/package.json`'s own `dependencies`/`devDependencies` — read that file and use its exact ranges instead of the numbers above if they differ; those are the authoritative versions.)

Update `scripts.typecheck` to:
```json
"typecheck": "tsc --noEmit && vue-tsc --noEmit -p ui/tsconfig.json"
```

- [ ] **Step 3: Install and verify resolution**

```bash
npm install
node -e "console.log(require('@life_uikit/uikit/package.json').version)"
```
Expected: prints `7.0.2`. If npm complains about the `file:` path, confirm it's relative to the repo root (where `package.json` lives), not to `ui/`.

- [ ] **Step 4: `ui/vite.config.ts`**

```ts
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const DESK_UI = 'http://127.0.0.1:4717';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vue()],
  build: {
    outDir: fileURLToPath(new URL('../dist/ui', import.meta.url)),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: DESK_UI,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (req) => req.setHeader('origin', DESK_UI));
        },
      },
    },
  },
});
```

- [ ] **Step 5: `ui/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "vite.config.ts"]
}
```
(`jsx` option removed — not a Vue concept; `vue-tsc` understands `.vue` SFCs on its own via its own plugin, no extra compiler option needed.)

- [ ] **Step 6: `ui/src/styles/tokens.css`**

Per spec section 6. This file assumes `@life_uikit/uikit/variables.css` and `variables-dark.css` are already loaded (Step 8, `main.ts`) — it only adds tokens the kit doesn't define.

```css
:root {
  --board-bg: var(--background-tertiary-enabled);
  --board-grid-line: var(--border-secondary-enabled);
  --column-bg: var(--background-secondary-a-enabled);
  --column-accent: var(--content-primary-a-enabled);
  --card-bg: var(--background-primary-a-enabled);
  --card-border: var(--border-secondary-enabled);
  --card-shadow: var(--shadow-small);

  --text: var(--content-primary-a-enabled);
  --text-muted: var(--content-secondary-enabled);
  --text-faint: var(--content-tertiary-enabled);

  --focus-ring: var(--content-accent-enabled);
  --button-primary-bg: var(--background-accent-enabled);

  --tag-bg: var(--background-tertiary-enabled);
  --tag-fg: var(--content-secondary-enabled);

  --wip-ok: var(--content-tertiary-enabled);
  --wip-over: var(--content-system-negative);

  --invalid-border: var(--content-system-negative);
  --invalid-bg: color-mix(in srgb, var(--content-system-negative) 8%, var(--card-bg));

  --font-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace;
  --column-width: min(19rem, calc(100vw - 2rem));
}

.priority-p0 { color: var(--content-system-negative); background: color-mix(in srgb, var(--content-system-negative) 14%, var(--card-bg)); }
.priority-p1 { color: var(--content-system-warning); background: color-mix(in srgb, var(--content-system-warning) 14%, var(--card-bg)); }
.priority-p2 { color: var(--content-action-enabled); background: color-mix(in srgb, var(--content-action-enabled) 12%, var(--card-bg)); }
.priority-p3 { color: var(--content-system-neutral); background: var(--background-tertiary-enabled); }
.priority-pill { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
```

- [ ] **Step 7: `ui/src/App.vue` (skeleton — full version is Task 7)**

```vue
<script setup lang="ts"></script>

<template>
  <main class="app-state">Загрузка доски…</main>
</template>
```

- [ ] **Step 8: `ui/src/main.ts`**

```ts
import '@life_uikit/uikit/variables.css';
import '@life_uikit/uikit/fonts.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import { createApp } from 'vue';
import TNLifeUIKit from '@life_uikit/uikit';
import App from './App.vue';

const container = document.getElementById('root');
if (!container) throw new Error('#root не найден в index.html');
const app = createApp(App);
app.use(TNLifeUIKit);
app.mount(container);
```

- [ ] **Step 9: Remove `ui/src/main.tsx`, verify build**

```bash
rm ui/src/main.tsx
npm run build:ui
```
Expected: builds without error, `dist/ui/index.html` references a single JS entry.

- [ ] **Step 10: Manual smoke check**

```bash
npm run build:server
DIR=$(mktemp -d) && cd "$DIR" && node ~/projects/desk/dist/cli/index.js init && node ~/projects/desk/dist/cli/index.js ui --port 4717 &
sleep 1 && curl -s -H 'host: 127.0.0.1:4717' http://127.0.0.1:4717/ | grep -o '<title>[^<]*'
```
Expected: prints the page title. Open `http://127.0.0.1:4717` in a browser — page shows "Загрузка доски…" with no console errors. Stop the server (`kill %1`), `cd` back to the repo.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json ui/vendor ui/vite.config.ts ui/tsconfig.json ui/src/main.ts ui/src/App.vue ui/src/styles/tokens.css
git rm ui/src/main.tsx
git commit -m "chore: vendor tn-uikit and switch ui/ build to Vue 3 + Vite"
```

---

### Task 2: Byte-identical port of `api/` and `lib/`

**Files:**
- Create: `ui/src/api/client.ts`, `ui/src/api/types.ts`
- Create: `ui/src/lib/fields.ts`, `ui/src/lib/fields.test.ts`
- Create: `ui/src/lib/transitions.ts`, `ui/src/lib/transitions.test.ts`
- Create: `ui/src/lib/filters.ts`, `ui/src/lib/filters.test.ts`
- Create: `ui/src/lib/markdown.ts`, `ui/src/lib/markdown.test.ts`
- Create: `ui/src/lib/agentColor.ts`, `ui/src/lib/agentColor.test.ts`
- Create: `ui/src/lib/priority.ts`, `ui/src/lib/priority.test.ts`
- Create: `ui/src/lib/format.ts`
- Create: `ui/src/lib/test-fixtures.ts`

**Interfaces:**
- Consumes: nothing framework-specific — these files never imported `react` on `main`
- Produces: every export the current `main` branch's `ui/src/api/*.ts` and `ui/src/lib/*.ts` produce, unchanged: `api`, `ApiRequestError`, `errorMessage`, `FieldChanges`; `Draft`, `TaskDraft`, `PanelState`, `ASSIGNEE_FIELD`, `fieldInfo`, `defaultsFor`, `compactFields`, `diffFields`, `toDraft`, `buildUpdate`, `isDirty`, `parseNumberInput`, `rebaseDraft`, `mergeFresh`, `isUnreadable`, `undeclaredFields`; `allowedTargets`, `requiredFor`, `isEmptyValue`, `missingForMove`, `groupByColumn`, `orphanTasks`; `Filters`, `EMPTY_FILTERS`, `filtersFromSearch`, `filtersToSearch`, `applyFilters`; `renderMarkdown`; `agentHue`, `agentColor`; `PriorityTone`, `priorityTone`; `formatTime`

This task has no algorithm to write — every file below is copied unchanged from `main`. TDD here means: prove the files are unchanged (diff empty), then prove the ported tests still pass in the new toolchain (Vite/Vitest config from Task 1, not the old React one).

- [ ] **Step 1: Copy every file from `main`, byte-for-byte**

```bash
for f in api/client.ts api/types.ts \
         lib/fields.ts lib/fields.test.ts \
         lib/transitions.ts lib/transitions.test.ts \
         lib/filters.ts lib/filters.test.ts \
         lib/markdown.ts lib/markdown.test.ts \
         lib/agentColor.ts lib/agentColor.test.ts \
         lib/priority.ts lib/priority.test.ts \
         lib/format.ts lib/test-fixtures.ts; do
  mkdir -p "ui/src/$(dirname "$f")"
  git show main:"ui/src/$f" > "ui/src/$f"
done
```

- [ ] **Step 2: Verify zero drift**

```bash
for f in api/client.ts api/types.ts lib/fields.ts lib/fields.test.ts lib/transitions.ts lib/transitions.test.ts lib/filters.ts lib/filters.test.ts lib/markdown.ts lib/markdown.test.ts lib/agentColor.ts lib/agentColor.test.ts lib/priority.ts lib/priority.test.ts lib/format.ts lib/test-fixtures.ts; do
  diff <(git show main:"ui/src/$f") "ui/src/$f" && echo "OK: $f"
done
```
Expected: every line prints `OK: <path>`, no diff output. If any file differs, you copied wrong — redo Step 1 for that file, don't hand-edit it to match.

- [ ] **Step 3: Run the ported tests under the new Vitest config**

```bash
npx vitest run ui/src/lib
```
Expected: PASS, same test count as `main` reports for these files (check `git show main:vitest.config.ts` doesn't scope `ui/src/lib` differently — it shouldn't, since the root `vitest.config.ts` from Task 1 isn't touched by this task and already includes `ui/src/**/*.test.ts`, per the config on `main`).

- [ ] **Step 4: `npx tsc --noEmit` is not applicable here** (these are plain `.ts`, checked by root `tsc`, which already includes `ui/src` per `main`'s `tsconfig.json`) — run it anyway to confirm:

```bash
npx tsc --noEmit
```
Expected: clean (these files have no React types to trip on — confirmed during planning: none of them import from `react`).

- [ ] **Step 5: Commit**

```bash
git add ui/src/api ui/src/lib
git commit -m "feat: port framework-agnostic api and lib modules from the React UI unchanged"
```
