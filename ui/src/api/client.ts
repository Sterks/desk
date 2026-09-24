import type { ApiError, BoardInfo, FieldValue, ProjectInfo, TaskFull, TaskList, UnreadableTask } from './types';

export class ApiRequestError extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.error = error;
  }
}

export type FieldChanges = Record<string, FieldValue | null>;
type Envelope<T> = { ok: true; data: T } | { ok: false; error: ApiError };

const localError = (code: string, message: string): ApiError => ({ code, message, field: null, guide: null, allowed: null });

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError(localError('NETWORK', 'Нет связи с desk ui. Сервер запущен?'));
  }
  let envelope: Envelope<T>;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiRequestError(localError('INTERNAL', `desk ui ответил ${res.status} без JSON`));
  }
  if (!envelope.ok) throw new ApiRequestError(envelope.error);
  return envelope.data;
}

const taskUrl = (id: string, suffix = ''): string => `/api/tasks/${encodeURIComponent(id)}${suffix}`;

export const api = {
  project: () => request<ProjectInfo>('GET', '/api/project'),
  board: () => request<BoardInfo>('GET', '/api/board'),
  tasks: () => request<TaskList>('GET', '/api/tasks'),
  task: (id: string) => request<TaskFull | UnreadableTask>('GET', taskUrl(id)),
  create: (input: { title: string; description?: string; column?: string; fields?: FieldChanges }) =>
    request<TaskFull>('POST', '/api/tasks', input),
  update: (id: string, input: { title?: string; description?: string; fields?: FieldChanges }) =>
    request<TaskFull>('PATCH', taskUrl(id), input),
  move: (id: string, to: string, fields: FieldChanges = {}) => request<TaskFull>('POST', taskUrl(id, '/move'), { to, fields }),
  addNote: (id: string, text: string) => request<TaskFull>('POST', taskUrl(id, '/notes'), { text }),
};

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
