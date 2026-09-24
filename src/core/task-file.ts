import { Document, isMap, isSeq, parse } from 'yaml';
import { BUILTIN_FIELDS, type FieldValue, type HistoryEntry, type Note, type Task } from './types.js';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
const NOTES_HEADING = '## Notes';
const NOTE_RE = /^- (\S+) · ([^:]+): (.*)$/;
/** Строка описания, совпадающая с заголовком заметок (с любым числом ведущих `\`), экранируется ещё одним `\`. */
const ESCAPABLE_RE = /^(\\*)## Notes$/;
const BUILTIN = new Set<string>(BUILTIN_FIELDS);

export interface ParsedTaskFile {
  task: Task | null;
  errors: string[];
}

export function parseTaskFile(text: string, fileId: string): ParsedTaskFile {
  const match = FRONTMATTER_RE.exec(text.replace(/\r\n/g, '\n'));
  if (!match) return { task: null, errors: ['нет frontmatter между строками ---'] };

  let data: unknown;
  try {
    data = parse(match[1] ?? '');
  } catch (e) {
    return { task: null, errors: [`frontmatter: ${(e as Error).message}`] };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { task: null, errors: ['frontmatter должен быть YAML-объектом'] };
  }

  const fm = data as Record<string, unknown>;
  const errors: string[] = [];
  const requiredString = (key: string): string => {
    const value = fm[key];
    if (typeof value === 'string' && value !== '') return value;
    errors.push(`${key}: ожидается непустая строка`);
    return '';
  };

  if (fm.id !== fileId) errors.push(`id в frontmatter (${String(fm.id)}) не совпадает с именем файла (${fileId})`);
  const title = requiredString('title');
  const column = requiredString('column');
  const createdBy = requiredString('created_by');
  const createdAt = requiredString('created_at');
  const updatedAt = requiredString('updated_at');
  const assignee = typeof fm.assignee === 'string' && fm.assignee !== '' ? fm.assignee : undefined;
  if (fm.assignee !== undefined && fm.assignee !== null && assignee === undefined) {
    errors.push('assignee: ожидается строка');
  }
  const agent = typeof fm.agent === 'string' && fm.agent !== '' ? fm.agent : undefined;
  if (fm.agent !== undefined && fm.agent !== null && agent === undefined) errors.push('agent: ожидается строка');
  const history = parseHistory(fm.history, errors);
  const fields = Object.fromEntries(
    Object.entries(fm)
      .filter(([key]) => !BUILTIN.has(key))
      .filter(([key, value]) => {
        if (isFieldValue(value)) return true;
        errors.push(`${key}: неподдерживаемое значение, ожидается строка, число, bool или список строк`);
        return false;
      }),
  ) as Record<string, FieldValue>;
  const { description, notes } = splitBody(match[2] ?? '');

  const task: Task = {
    id: fileId,
    title,
    column,
    ...(assignee === undefined ? {} : { assignee }),
    ...(agent === undefined ? {} : { agent }),
    createdBy,
    createdAt,
    updatedAt,
    fields,
    history,
    description,
    notes,
  };
  return { task, errors };
}

function isFieldValue(value: unknown): value is FieldValue {
  if (typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function parseHistory(value: unknown, errors: string[]): HistoryEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push('history: ожидается список');
    return [];
  }
  return value.flatMap((entry, i): HistoryEntry[] => {
    const e = entry as Record<string, unknown> | null;
    const valid =
      e !== null &&
      typeof e === 'object' &&
      typeof e.at === 'string' &&
      typeof e.by === 'string' &&
      typeof e.to === 'string' &&
      (e.from === null || typeof e.from === 'string');
    if (!valid) {
      errors.push(`history[${i}]: ожидается { at, by, from, to }`);
      return [];
    }
    return [{ at: e.at as string, by: e.by as string, from: e.from as string | null, to: e.to as string }];
  });
}

export function splitBody(body: string): { description: string; notes: Note[] } {
  const marker = `\n${NOTES_HEADING}\n`;
  const padded = `\n${body}`;
  const index = padded.lastIndexOf(marker);
  if (index === -1) return { description: unescapeDescription(body.trim()), notes: [] };

  const lines = padded
    .slice(index + marker.length)
    .split('\n')
    .filter((line) => line.trim() !== '');
  const matches = lines.map((line) => NOTE_RE.exec(line));
  if (matches.length === 0 || matches.some((m) => m === null)) return { description: unescapeDescription(body.trim()), notes: [] };

  return {
    description: unescapeDescription(padded.slice(0, index).trim()),
    notes: matches.map((m) => ({ at: m?.[1] ?? '', by: m?.[2] ?? '', text: m?.[3] ?? '' })),
  };
}

const mapLines = (text: string, fn: (line: string) => string): string => text.split('\n').map(fn).join('\n');

/**
 * `## Notes` в описании пишется как `\## Notes`, чтобы не спутать его с настоящим разделом заметок.
 * Переводы строк сначала приводятся к `\n`: иначе `\r\n## Notes` обошёл бы экранирование и дал поддельные заметки.
 */
export function escapeDescription(text: string): string {
  return mapLines(text.replace(/\r\n?/g, '\n'), (line) => (ESCAPABLE_RE.test(line) ? `\\${line}` : line));
}

export function unescapeDescription(text: string): string {
  return mapLines(text, (line) => (ESCAPABLE_RE.test(line) && line.startsWith('\\') ? line.slice(1) : line));
}

export function formatNote(note: Note): string {
  return `- ${note.at} · ${note.by}: ${note.text}`;
}

export function serializeTask(task: Task): string {
  const frontmatter = {
    id: task.id,
    title: task.title,
    column: task.column,
    ...(task.assignee === undefined ? {} : { assignee: task.assignee }),
    ...(task.agent === undefined ? {} : { agent: task.agent }),
    created_by: task.createdBy,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    ...task.fields,
    history: task.history.map((h) => ({ at: h.at, by: h.by, from: h.from, to: h.to })),
  };
  const doc = new Document(frontmatter);
  const history = doc.get('history', true);
  if (isSeq(history)) {
    for (const item of history.items) if (isMap(item)) item.flow = true;
  }
  const notes = task.notes.length > 0 ? `\n\n${NOTES_HEADING}\n${task.notes.map(formatNote).join('\n')}` : '';
  const body = `${escapeDescription(task.description)}${notes}`.trim();
  return `---\n${doc.toString({ lineWidth: 0 })}---\n${body === '' ? '' : `${body}\n`}`;
}
