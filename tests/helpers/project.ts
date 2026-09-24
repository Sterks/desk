import { mkdir, mkdtemp, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const TEST_BOARD = `version: 1
name: test
id_prefix: T
guide: Общие правила.
columns:
  - id: backlog
    title: Backlog
    guide: Новые задачи.
  - id: in_progress
    title: In progress
    wip_limit: 2
    guide: В работе.
  - id: review
    title: Review
  - id: done
    title: Done
transitions:
  - from: backlog
    to: in_progress
    requires: [assignee]
  - from: in_progress
    to: review
    requires: [pr_url]
  - from: in_progress
    to: backlog
  - from: review
    to: [in_progress, done]
fields:
  - id: priority
    type: enum
    values: [p0, p1, p2, p3]
    required: true
    default: p2
    guide: p0 — прод лежит.
  - id: area
    type: multi_enum
    values: [backend, frontend]
  - id: pr_url
    type: url
    guide: Ссылка на PR.
  - id: estimate
    type: number
    min: 0
    max: 100
  - id: due
    type: date
  - id: blocked_by
    type: task_ref
  - id: flaky
    type: bool
  - id: summary
    type: string
  - id: acceptance
    type: text
`;

/** Временная папка проекта с `.desk/board.yaml` и пустой `.desk/tasks/`. Путь уже через realpath. */
export async function makeProject(boardYaml: string = TEST_BOARD): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'desk-')));
  await mkdir(join(root, '.desk', 'tasks'), { recursive: true });
  await writeFile(join(root, '.desk', 'board.yaml'), boardYaml);
  return root;
}

/** Пустая временная папка без `.desk/`. */
export async function makeEmptyDir(): Promise<string> {
  return realpath(await mkdtemp(join(tmpdir(), 'desk-empty-')));
}

export function fixedClock(iso = '2026-09-24T10:00:00Z'): () => Date {
  return () => new Date(iso);
}
