# Part 5. E2E and cutover (Tasks 9–10)

Index, Global Constraints, Review Focus: `../2026-09-24-desk-vue-ui.md`. Spec: section 9.

---

### Task 9: E2E functional suite — port all scenarios

**Files:**
- Modify: `tests/e2e/fixtures.ts`, `tests/e2e/board.spec.ts`
- Modify: `tests/e2e/start-server.mjs` (verify unchanged — see Step 1)

**Interfaces:**
- Consumes: the fully wired app from Tasks 1–8
- Produces: the same 20 scenarios `main`'s `tests/e2e/board.spec.ts` has, passing against the new UI, plus one new scenario this plan's design added (cancel-requires-dialog reverts the card, Review Focus #1) and one new scenario for the theme-toggle/OS-preference interaction (Review Focus #5)

- [ ] **Step 1: Verify `start-server.mjs` needs no changes**

`tests/e2e/start-server.mjs` on `main` imports `startHttpServer` from `dist/http/server.js` and passes `testReset: true` — this plan never touches `src/http`, so this file is correct as-is. Confirm `dist/ui/` (the build output Task 1's `vite.config.ts` still targets) is what `staticDir` points at — unchanged. No edits expected; if `npm run build` changes the output structure in a way that breaks this, fix `start-server.mjs`, don't work around it elsewhere.

- [ ] **Step 2: `tests/e2e/fixtures.ts` — verify/adjust `dragTo`**

Port `fixtures.ts` from `main` unchanged **except** the `dragTo` helper's comment and step count, which assumed `@dnd-kit`'s 5px pointer-activation distance:
```ts
git show main:tests/e2e/fixtures.ts > tests/e2e/fixtures.ts
```
Then re-examine `dragTo` against `vue-draggable-plus`/SortableJS's actual drag-start threshold (SortableJS's default `Sortable.Options` has no pointer-distance activation constraint by default — it starts on `mousedown` + a small delay/threshold that differs from dnd-kit's). Adjust the comment and, if Task 8's manual testing showed the existing `steps: 5`/`steps: 20` mouse-move sequence doesn't reliably trigger a drag under the new library, adjust the step counts/positions to what actually works — verify empirically against the real running app, don't guess.

Add a helper for the new cancel-requires-dialog test (Step 4 below) if useful, e.g. a way to read a card's current column from the DOM to confirm it reverted (`column(page, title).getByTestId('card-...')` already gives this via existing helpers — likely no new helper needed).

- [ ] **Step 3: Port `board.spec.ts`, scenario by scenario**

```bash
git show main:tests/e2e/board.spec.ts > tests/e2e/board.spec.ts
```
Then go through every one of the 20 scenarios and adjust ONLY what the new DOM structure requires — the assertions and product behavior stay identical. Known adjustments, from what planning verified about the new components:

1. **"доска показывает колонки…"** — no change expected (`column`/`card` helpers, role="region" from `Column.vue`'s `aria-label`, unchanged).
2. **"перенос без assignee открывает окно requires…"** — `dialog.getByLabel('assignee')` now targets `TNInput`'s rendered `<input>` for the `ASSIGNEE_FIELD` `FieldInput` — confirm `TNInput` actually associates its `label` prop with the native input via a real `<label for>` (needed for `getByLabel` to work at all); if it uses a different association mechanism (`aria-label` instead of `<label for>`), `getByLabel` still works either way, but confirm which. The focus-delay comment in this test ("Окно само фокусирует первое поле…") should be updated per Task 8 Step 6's actual finding (keep it if the delay still applies, rewrite it if it doesn't reproduce with the new drag library).
3. **"запрещённый переход…"** — with Task 8's synchronous SortableJS `onMove` block, the drop never lands in the blocked column at all (stronger guarantee than before) — the toast-with-message assertion still applies since `handleMove`/`performMove` in `App.vue` is only reached for *allowed* drops in this new design... **wait**, re-read Task 8: the toast-on-forbidden-drop behavior in the CURRENT React version happens because `@dnd-kit` lets the drop happen and `onMove(task, to)` is still called for a *blocked* target, and the server rejects it, producing the toast. Task 8's design makes blocked columns physically un-droppable at the SortableJS level, meaning `onAdd`/`move` never even fires for a blocked target — **this is a behavior change from the current React version, not just an implementation detail**, and this scenario's assertion ("toast объясняет причину") would need the drop to actually reach the server to produce a toast. Resolve this explicitly: either (a) keep Task 8's synchronous block (stronger UX, no need for a server round-trip or a toast for something the UI already knows is disallowed) and rewrite this test to assert the card simply never leaves its origin column with no toast expected, or (b) loosen Task 8's `onMove` gate to only block visually (dim) without refusing the drop, always calling `handleMove` and letting the server's rejection produce the toast, matching the current test verbatim. **Decide (a)** — it's the stronger, already-approved Task 8 design, and a toast for something the UI physically prevented is redundant, not a regression. Rewrite this test accordingly and say so in the report; this is a deliberate, disclosed product-behavior improvement, not a silently dropped scenario.
4. **"WIP-лимит…"** — same reconsideration as #3: does Task 8's `onMove` gate also check `checkWip`-equivalent client-side, or does WIP overflow still round-trip to the server for its toast? `allowedTargets` (Task 2) does **not** check WIP limits — only transition rules — so a WIP-full column is NOT blocked by `onMove`'s gate, the drop proceeds, `handleMove`→`performMove` calls the server, which rejects with `WIP_LIMIT`, and the existing toast assertion (`'3 из 3'`) still applies unchanged. No behavior change here — confirm this distinction is correct (transition-forbidden is blocked client-side per #3's decision; WIP-limit is not, and still needs a server round-trip) before assuming #3's fix also silences this one.
5. **"задача, которую агент записал в файл…"** — no change expected.
6. **"поиск фильтрует…"** — `page.getByRole('searchbox', { name: 'Поиск по ID и названию' })` — depends on Task 6 Step 4's `TNSearch` role finding; if `TNSearch` doesn't produce `role="searchbox"`, this test breaks and needs the fix noted in that task (explicit `role` override or plain `<input type="search">`).
7. **"панель: правка названия сохраняется в файл"** — `panel.getByRole('dialog', { name: 'T-001' })` now depends on `TaskPanel.vue`'s own `role="dialog" aria-modal="true" :aria-label="taskId"` (Task 5) — already written that way, should match unchanged.
8. **"клавиатура: Enter открывает панель…"** — confirm `TaskCard.vue`'s title `<button>` still receives Enter-to-activate natively (it's a real `<button>`, same as React) — no change expected.
9. **"axe: нет нарушений…"** — run as-is; fix whatever axe flags on the real `tn-uikit` components rather than suppressing the rule (per Global Constraints' accessibility bullet).
10. **"задача из удалённой колонки видна в баннере…"** — no change expected (`Banners.vue` ported 1:1 in behavior).
11. **"тип сабагента виден на карточке и в шапке панели"** — `card(page, 'T-001').locator('.card-agent')` and `.panel-agent` — both class names kept identical in the Vue port (Task 4/5), should match unchanged.
12. **"панель: числовое поле сохраняется…"** — depends on Task 5's `FieldInput.vue` number branch and `parseNumberInput`; the `patch.postDataJSON()` assertion (`{ fields: { estimate: 5 } }`) is the Review Focus item this plan's Task 5 must not regress — verify it actually holds against `TNInput`'s emitted value shape (string vs number — `TNInput`'s `modelValue` is typed `string` per its own props, confirmed during planning, so `FieldInput.vue`'s `parseNumberInput(v)` call on the emitted string is what makes this work; don't let a future edit bind `TNInput`'s `modelValue` to the raw number).
13. **"панель: живое обновление не затирает несохранённую правку"** — depends on `mergeFresh` (Task 2, unchanged) and `TaskPanel.vue`'s `watch` on `[taskId, version]` (Task 5) re-running `load()` on every SSE-triggered `version` bump while preserving a dirty draft — this is Review Focus #2, give it real attention if it fails.
14. **"фильтр по полю и открытая задача живут в URL"** — depends on `useUrlFilters` (Task 3) — no change expected.
15. **"во время перетаскивания запрещённые колонки тускнеют…"** — rewrite the mouse-sequence assertions against Task 8's real `data-drop` values and timing; the `opacity: 0.38` CSS assertion stays (unchanged rule in `board.css`). Since Task 8's design makes a truly-blocked drop physically refuse the drop, this test's dimming-during-drag assertions still apply (dimming happens continuously during the drag gesture, before any drop occurs) — only the drop-completion part changes per scenario #3 above.
16. **"счётчик WIP…"** — `--color-critical` in the original assertion needs to become the new token (`--wip-over`) — update the `page.evaluate` probe accordingly:
    ```ts
    probe.style.color = 'var(--wip-over)';
    ```
17. **"панель: параллельная запись агента не откатывается…"** — this is Review Focus #2's E2E anchor — keep it exactly, it's the regression test for `rebaseDraft`.
18. **"панель: перенос через выбор колонки открывает окно requires…"** — no change expected in principle; verify the `useDialogStack`/Escape-only-closes-innermost-dialog behavior (Task 6's design decision) produces the exact same observable result as the React version's `preventDefault` trick — this test's Escape-closes-only-the-dialog assertion is exactly what would break if `useDialogStack` has a bug.
19. **"баннеры invalid_files и duplicate_ids…"** — no change expected.
20. **"панель: поле, удалённое из board.yaml, можно убрать…"** — no change expected (`undeclaredFields`, unchanged).
21. **"ошибка отрисовки панели не роняет доску (error boundary)"** — this is Review Focus #4 — the `page.route` mock returning `{id: 'T-001'}` with nothing else must trigger `onErrorCaptured` in `ErrorBoundary.vue` (Task 5) the same way it triggered React's `getDerivedStateFromError`. If it doesn't (e.g. because Vue's reactivity fails silently instead of throwing where React would), report BLOCKED with the specifics — this is exactly the kind of framework-behavior difference this plan flagged as a risk up front, not something to paper over.
22. **"ошибка отрисовки всего приложения…"** — same concern, at the `AppRoot.vue` level (Task 7's fix-up).

- [ ] **Step 4: Add the new cancel-requires-dialog test (Review Focus #1)**

```ts
test('отмена окна requires возвращает карточку в исходную колонку', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Отменяемый перенос', column: 'backlog' }]);
  await dragTo(page, card(page, 'T-001'), column(page, 'In progress'));
  const dialog = page.getByRole('dialog', { name: 'T-001 → In progress' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(column(page, 'Backlog').getByTestId('card-T-001')).toBeVisible();
  await expect(column(page, 'In progress').getByTestId('card-T-001')).toHaveCount(0);
  const onDisk = await readTask('T-001');
  expect(onDisk).toContain('column: backlog');
});
```

- [ ] **Step 5: Add a theme-toggle test (Review Focus #5)**

```ts
test('переключение темы вручную переопределяет системную и переживает перезагрузку', async ({ page }) => {
  await openBoard(page, [{ id: 'T-001', title: 'Тема', column: 'backlog' }]);
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/tn-dark-theme/);
  await page.getByRole('button', { name: 'Переключить тему' }).click();
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/); // override remembered via localStorage
  await page.emulateMedia({ colorScheme: 'dark' }); // OS changes while override is active — must NOT flip back to "light"
  await expect(page.locator('html')).toHaveClass(/tn-dark-theme/);
});
```

- [ ] **Step 6: Run the full functional suite**

```bash
npm run build && npx playwright test tests/e2e/board.spec.ts --project=chromium
```
Iterate on real failures (adjust selectors/timing, per Steps 2–5's guidance) until this passes. Then run all three browsers:
```bash
npx playwright test tests/e2e/board.spec.ts
```
Expected: all 22 scenarios pass on chromium, firefox, webkit. Fix real bugs, not the tests, unless a test's assertion was genuinely about old-library behavior this plan deliberately changed (scenario #3's rewrite is the one sanctioned case — don't extend that reasoning to anything else without writing down why, the same way #3 is written down above).

- [ ] **Step 7: Commit**

```bash
git add tests/e2e/fixtures.ts tests/e2e/board.spec.ts
git commit -m "test: port the E2E functional suite to the Vue UI, add cancel-drop and theme tests"
```

---

### Task 10: Visual regression, axe, package cleanup, final verification

**Files:**
- Modify: `tests/e2e/visual.spec.ts` (port unchanged — see Step 1)
- Delete: every old React file `git show main:ui/src --stat` lists that Tasks 1–9 didn't recreate
- Delete: `tests/e2e/visual.spec.ts-snapshots/*-darwin.png` (old baselines — invalid for the new UI)
- Modify: `README.md` (mentions of React/`@dnd-kit` in the developer-facing sections, if any)

**Interfaces:**
- Consumes: the complete Vue UI (Tasks 1–9)
- Produces: a clean `main`-mergeable branch — no dead React files, fresh visual baselines, green full suite

- [ ] **Step 1: `tests/e2e/visual.spec.ts`**

Port unchanged from `main` (`git show main:tests/e2e/visual.spec.ts > tests/e2e/visual.spec.ts`) — the scenario list (4 widths × 2 themes × 3 browsers + 2 no-horizontal-scroll checks) doesn't depend on the framework, only on the rendered page. No edits expected.

- [ ] **Step 2: Delete every leftover React file**

```bash
git show main:ui/src --name-only -r 2>/dev/null || git ls-tree -r --name-only main -- ui/src
```
Cross-reference against what Tasks 1–9 actually created under `ui/src/` in this plan (every `.vue`/`.ts` file named in Parts 1–4, plus `App.vue`, `AppRoot.vue`, `main.ts`). Any file from that `main` listing not recreated here (all the old `.tsx` files, `ui/src/hooks/*.ts` — replaced by `ui/src/composables/*.ts`, `ui/src/ui/Modal.tsx`/`Toast.tsx` — replaced by `TNPopup`/`useToaster`) should already be gone since this plan never `git show`'d them into new paths — confirm with:
```bash
find ui/src -name "*.tsx" -o -name "*.jsx"
```
Expected: no output. If any `.tsx` file remains, delete it — it's dead React code this plan superseded.

- [ ] **Step 3: Regenerate every visual baseline**

```bash
npm run build
npx playwright test tests/e2e/visual.spec.ts --update-snapshots
```
Expected: 26 new baselines (4 widths × 2 themes × 3 browsers = 24, plus the 2 no-scroll checks aren't screenshots). Open a representative sample (Read tool, PNG) for chromium at 320px light, 1440px dark, and confirm by eye: the priority pill/timestamp/tag/avatar card layout matches the approved mockup's structure (minus the documented description/notes-count omission), colors come from `tn-uikit` (not the old oklch palette), dark theme actually looks different from light (not just a class toggle that changes nothing), no clipped text, no obvious layout breakage at 320px.

- [ ] **Step 4: Full final verification**

```bash
npm run typecheck
npm run test
npm run test:coverage   # lib/* coverage should be unchanged from main (same files, same tests)
npm run test:e2e
```
Expected: all green, including axe (scenario 9 from Task 9) with zero violations on the real `tn-uikit` components — if axe flags something inherent to a `tn-uikit` component (not something this plan's own markup introduced), report it precisely (component name, violation, WCAG rule) rather than silently wrapping it to hide the violation from axe.

- [ ] **Step 5: `README.md`**

Update any section describing the frontend stack (React/`@dnd-kit`) to describe Vue 3/`tn-uikit`/`vue-draggable-plus` instead. Keep everything else (CLI usage, MCP tools, hooks) untouched — this plan doesn't touch that surface.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: regenerate visual baselines, remove dead React files, update README for the Vue UI"
```

## Final report

After Task 10, write a short summary (in your final message to the controller, not a new file) covering: every deliberate behavior change from the React baseline this plan made (scenario #3's rewrite, the `onMove` synchronous block being stronger than before, anything Task 6/8's "verify against the real component" caveats turned up), and every place a task's sketch code needed a real fix during implementation (the `RequiresDialog` submit-callback shape, the `TNPopup` ARIA fallthrough, `TNSearch`'s role, `TNTextarea`/`TNCheckbox`'s exact props) — these are exactly the kind of decisions a reviewer needs surfaced, not buried in individual commit messages.
