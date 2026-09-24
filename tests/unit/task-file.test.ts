import { describe, expect, it } from 'vitest';
import { parseTaskFile, serializeTask, splitBody } from '../../src/core/task-file.js';
import type { Task } from '../../src/core/types.js';
import { testTask } from '../helpers/board.js';

const sample: Task = testTask({
  id: 'T-012',
  title: 'Добавить rate limit на /api/login',
  column: 'in_progress',
  assignee: 'backend-agent',
  createdAt: '2026-09-24T10:30:00Z',
  updatedAt: '2026-09-24T11:02:00Z',
  fields: { priority: 'p1', area: ['backend'], estimate: 2, flaky: false, acceptance: 'строка 1\nстрока 2' },
  history: [
    { at: '2026-09-24T10:30:00Z', by: 'planner', from: null, to: 'backlog' },
    { at: '2026-09-24T11:02:00Z', by: 'backend-agent', from: 'backlog', to: 'in_progress' },
  ],
  description: 'Описание задачи.\n\n- пункт 1\n- пункт 2',
  notes: [{ at: '2026-09-24T11:05:00Z', by: 'backend-agent', text: 'выбрал express-rate-limit.' }],
});

describe('serializeTask', () => {
  it('пишет встроенные поля первыми, в фиксированном порядке', () => {
    const text = serializeTask(sample);
    expect(text.startsWith(
      '---\nid: T-012\ntitle: Добавить rate limit на /api/login\ncolumn: in_progress\nassignee: backend-agent\ncreated_by: planner\n',
    )).toBe(true);
  });

  it('history — по записи в строке, flow-стиль', () => {
    const text = serializeTask(sample);
    expect(text).toMatch(/^ {2}- \{ at: "?2026-09-24T10:30:00Z"?, by: planner, from: null, to: backlog \}$/m);
  });

  it('notes — раздел в конце тела', () => {
    const text = serializeTask(sample);
    expect(text.endsWith('\n## Notes\n- 2026-09-24T11:05:00Z · backend-agent: выбрал express-rate-limit.\n')).toBe(true);
  });

  it('без описания и notes тело пустое', () => {
    const text = serializeTask(testTask());
    expect(text.endsWith('---\n')).toBe(true);
  });
});

describe('parseTaskFile', () => {
  it('round-trip без потерь', () => {
    expect(parseTaskFile(serializeTask(sample), 'T-012')).toEqual({ task: sample, errors: [] });
  });

  it('CRLF читается так же, как LF', () => {
    const crlf = serializeTask(sample).replace(/\n/g, '\r\n');
    expect(parseTaskFile(crlf, 'T-012').task).toEqual(sample);
  });

  it('кириллица и эмодзи в title сохраняются', () => {
    const task = testTask({ title: 'Починить 🔥 ёжик: «кавычки» и #решётку' });
    expect(parseTaskFile(serializeTask(task), 'T-001').task?.title).toBe(task.title);
  });

  it('описание с собственным заголовком ## Notes не теряется', () => {
    const task = testTask({ description: 'Контекст.\n\n## Notes\nЭто часть описания, не заметка.' });
    expect(parseTaskFile(serializeTask(task), 'T-001').task).toEqual(task);
  });

  it('описание с ## Notes плюс настоящие notes — обе части сохраняются', () => {
    const task = testTask({
      description: 'Контекст.\n\n## Notes\nЧасть описания.',
      notes: [{ at: '2026-09-24T12:00:00Z', by: 'qa', text: 'проверил' }],
    });
    expect(parseTaskFile(serializeTask(task), 'T-001').task).toEqual(task);
  });

  it('неизвестные ключи frontmatter попадают в fields', () => {
    const text = '---\nid: T-001\ntitle: X\ncolumn: backlog\ncreated_by: a\ncreated_at: 2026-09-24T10:00:00Z\nupdated_at: 2026-09-24T10:00:00Z\nseverity: high\nhistory: []\n---\n';
    expect(parseTaskFile(text, 'T-001').task?.fields).toEqual({ severity: 'high' });
  });

  it('нет frontmatter — task null', () => {
    const result = parseTaskFile('просто текст', 'T-001');
    expect(result.task).toBeNull();
    expect(result.errors[0]).toContain('frontmatter');
  });

  it('сломанный YAML — task null', () => {
    expect(parseTaskFile('---\ntitle: [\n---\n', 'T-001').task).toBeNull();
  });

  it('frontmatter-список вместо объекта — task null', () => {
    expect(parseTaskFile('---\n- a\n---\n', 'T-001').task).toBeNull();
  });

  it('id не совпадает с именем файла — ошибка, id берётся из имени', () => {
    const result = parseTaskFile(serializeTask(testTask({ id: 'T-001' })), 'T-002');
    expect(result.task?.id).toBe('T-002');
    expect(result.errors.join()).toContain('не совпадает');
  });

  it('пропущенный title и кривая history — ошибки, задача читается', () => {
    const text = '---\nid: T-001\ncolumn: backlog\ncreated_by: a\ncreated_at: x\nupdated_at: x\nhistory:\n  - bad\n---\n';
    const result = parseTaskFile(text, 'T-001');
    expect(result.task).not.toBeNull();
    expect(result.errors.some((e) => e.startsWith('title'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('history'))).toBe(true);
  });

  it('значение-объект в пользовательском поле — ошибка', () => {
    const text = '---\nid: T-001\ntitle: X\ncolumn: backlog\ncreated_by: a\ncreated_at: x\nupdated_at: x\nmeta: { a: 1 }\nhistory: []\n---\n';
    expect(parseTaskFile(text, 'T-001').errors.join()).toContain('meta');
  });
});

describe('splitBody', () => {
  it('без раздела Notes всё — описание', () => {
    expect(splitBody('Текст\n')).toEqual({ description: 'Текст', notes: [] });
  });

  it('раздел Notes с не-заметками остаётся в описании', () => {
    expect(splitBody('А\n\n## Notes\nпросто текст\n')).toEqual({ description: 'А\n\n## Notes\nпросто текст', notes: [] });
  });
});

describe('agent field', () => {
  it('round-trips agent with a colon, written right after assignee', () => {
    const task = testTask({ assignee: 'reviewer', agent: 'ecc:code-reviewer' });
    const text = serializeTask(task);
    expect(text).toContain('assignee: reviewer\nagent: ecc:code-reviewer\ncreated_by:');
    const parsed = parseTaskFile(text, task.id);
    expect(parsed.errors).toEqual([]);
    expect(parsed.task).toEqual(task);
    expect(parsed.task?.fields).not.toHaveProperty('agent');
  });

  it('reports a non-string agent', () => {
    const text = serializeTask(testTask()).replace('created_by:', 'agent: 5\ncreated_by:');
    const parsed = parseTaskFile(text, 'T-001');
    expect(parsed.errors).toContain('agent: ожидается строка');
    expect(parsed.task?.agent).toBeUndefined();
  });
});

describe('"## Notes" inside the description', () => {
  const description = 'Шаги:\n\n## Notes\n- 2026-09-24T10:00:00Z · bob: не заметка';

  it('round-trips a line that already starts with a backslash', () => {
    const task = testTask({ description: 'x\n\\## Notes\n\\\\## Notes', notes: [] });
    expect(parseTaskFile(serializeTask(task), task.id).task?.description).toBe('x\n\\## Notes\n\\\\## Notes');
  });

  it('round-trips as description when the task has no notes', () => {
    const task = testTask({ description, notes: [] });
    const parsed = parseTaskFile(serializeTask(task), task.id);
    expect(parsed.task?.notes).toEqual([]);
    expect(parsed.task?.description).toBe(description);
  });

  it('keeps real notes separate from a description heading', () => {
    const notes = [{ at: '2026-09-24T11:00:00Z', by: 'alice', text: 'настоящая' }];
    const task = testTask({ description, notes });
    const parsed = parseTaskFile(serializeTask(task), task.id);
    expect(parsed.task?.notes).toEqual(notes);
    expect(parsed.task?.description).toBe(description);
  });

  it('escapes a line that is exactly "## Notes" on write', () => {
    expect(serializeTask(testTask({ description: 'a\n## Notes\nb' }))).toContain('a\n\\## Notes\nb');
  });
});
