import { describe, expect, it } from 'vitest';
import { formatPath, loadBoard, parseBoard } from '../../src/core/board-loader.js';
import { testBoard } from '../helpers/board.js';
import { catchError, catchErrorAsync } from '../helpers/errors.js';
import { TEST_BOARD, makeEmptyDir, makeProject } from '../helpers/project.js';

const base = (extra = ''): string => `version: 1\ncolumns:\n  - id: todo\n  - id: done\n${extra}`;

describe('parseBoard', () => {
  it('TEST_BOARD даёт ровно testBoard()', () => {
    expect(parseBoard(TEST_BOARD)).toEqual(testBoard());
  });

  it('подставляет значения по умолчанию', () => {
    expect(parseBoard(base())).toEqual({
      version: 1,
      name: 'desk',
      idPrefix: 'T',
      columns: [
        { id: 'todo', title: 'todo' },
        { id: 'done', title: 'done' },
      ],
      transitions: null,
      fields: [],
    });
  });

  it('to строкой превращается в массив, requires по умолчанию пустой', () => {
    const board = parseBoard(base('transitions:\n  - from: todo\n    to: done\n'));
    expect(board.transitions).toEqual([{ from: 'todo', to: ['done'], requires: [] }]);
  });

  it.each([
    ['синтаксис YAML', 'version: 1\ncolumns: [\n', 'строка'],
    ['пустой файл', '', 'корень'],
    ['version 2', 'version: 2\ncolumns:\n  - id: todo\n', 'version'],
    ['дубликат колонки', 'version: 1\ncolumns:\n  - id: todo\n  - id: todo\n', 'строка 4: columns[1].id'],
    ['плохой id колонки', 'version: 1\ncolumns:\n  - id: To Do\n', 'строка 3: columns[0].id'],
    ['wip_limit 0', 'version: 1\ncolumns:\n  - id: todo\n    wip_limit: 0\n', 'columns[0].wip_limit'],
    ['лишний ключ', 'version: 1\ncolums: []\ncolumns:\n  - id: todo\n', 'colums'],
    ['enum без values', base('fields:\n  - id: prio\n    type: enum\n'), 'строка 6: fields[0].values'],
    ['values у string', base('fields:\n  - id: s\n    type: string\n    values: [a]\n'), 'fields[0].values'],
    ['повтор values', base('fields:\n  - id: e\n    type: enum\n    values: [a, a]\n'), 'fields[0].values'],
    ['встроенное поле', base('fields:\n  - id: title\n    type: string\n'), 'строка 6: fields[0].id'],
    ['дубликат поля', base('fields:\n  - id: a\n    type: bool\n  - id: a\n    type: bool\n'), 'fields[1].id'],
    ['неизвестный тип', base('fields:\n  - id: a\n    type: money\n'), 'fields[0].type'],
    ['min больше max', base('fields:\n  - id: n\n    type: number\n    min: 5\n    max: 1\n'), 'fields[0].min'],
    ['min у string', base('fields:\n  - id: s\n    type: string\n    min: 1\n'), 'fields[0].min'],
    ['плохой default', base('fields:\n  - id: prio\n    type: enum\n    values: [a, b]\n    default: c\n'), 'строка 9: fields[0].default'],
    ['переход в несуществующую колонку', base('transitions:\n  - from: todo\n    to: nowhere\n'), 'строка 7: transitions[0].to'],
    ['переход из несуществующей колонки', base('transitions:\n  - from: ghost\n    to: done\n'), 'transitions[0].from'],
    ['несуществующая колонка в списке to', base('transitions:\n  - from: todo\n    to: [done, ghost]\n'), 'transitions[0].to[1]'],
    ['requires на неизвестное поле', base('transitions:\n  - from: todo\n    to: done\n    requires: [ghost]\n'), 'строка 8: transitions[0].requires[0]'],
  ])('%s → INVALID_BOARD', (_name, yaml, expected) => {
    const err = catchError(() => parseBoard(yaml));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain(expected);
  });

  it('requires: [assignee] допустим без объявления поля', () => {
    const board = parseBoard(base('transitions:\n  - from: todo\n    to: done\n    requires: [assignee]\n'));
    expect(board.transitions?.[0]?.requires).toEqual(['assignee']);
  });
});

describe('formatPath', () => {
  it('форматирует пути zod', () => {
    expect(formatPath(['fields', 2, 'values'])).toBe('fields[2].values');
    expect(formatPath([])).toBe('корень');
  });
});

describe('loadBoard', () => {
  it('читает .desk/board.yaml', async () => {
    const root = await makeProject();
    expect((await loadBoard(root)).name).toBe('test');
  });

  it('INVALID_BOARD с подсказкой, если файла нет', async () => {
    const dir = await makeEmptyDir();
    const err = await catchErrorAsync(() => loadBoard(dir));
    expect(err.code).toBe('INVALID_BOARD');
    expect(err.message).toContain('desk init');
  });
});
