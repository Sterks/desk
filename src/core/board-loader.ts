import { readFile } from 'node:fs/promises';
import { LineCounter, isNode, parseDocument, type Document } from 'yaml';
import { rawBoardSchema, toBoard } from './board-schema.js';
import { DeskError } from './errors.js';
import { boardPath } from './paths.js';
import type { Board } from './types.js';

export async function loadBoard(root: string): Promise<Board> {
  const path = boardPath(root);
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new DeskError('INVALID_BOARD', `Не найден ${path}. Запусти desk init в корне проекта.`);
    }
    throw e;
  }
  return parseBoard(text);
}

export function parseBoard(text: string): Board {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, prettyErrors: false });
  const [yamlError] = doc.errors;
  if (yamlError) {
    const line = lineCounter.linePos(yamlError.pos[0]).line;
    throw new DeskError('INVALID_BOARD', `board.yaml, строка ${line}: ${yamlError.message}`);
  }
  const result = rawBoardSchema.safeParse(doc.toJS());
  if (!result.success) {
    const [issue] = result.error.issues;
    const path = issue?.path ?? [];
    const line = lineOf(doc, lineCounter, path);
    const where = line === null ? 'board.yaml' : `board.yaml, строка ${line}`;
    throw new DeskError('INVALID_BOARD', `${where}: ${formatPath(path)}: ${issue?.message ?? 'неверная схема'}`);
  }
  return toBoard(result.data);
}

export function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return 'корень';
  return path.map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`)).join('');
}

/** Строка ближайшего существующего узла по пути: для отсутствующего `values` — строка самого поля. */
function lineOf(doc: Document, lineCounter: LineCounter, path: (string | number)[]): number | null {
  for (let n = path.length; n > 0; n--) {
    const node = doc.getIn(path.slice(0, n), true);
    if (isNode(node) && node.range) return lineCounter.linePos(node.range[0]).line;
  }
  return null;
}
