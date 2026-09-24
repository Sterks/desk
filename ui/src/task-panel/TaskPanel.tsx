import { useEffect, useId, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, FieldValue, TaskFull } from '../api/types';
import { ASSIGNEE_FIELD, buildUpdate, isDirty, toDraft, type TaskDraft } from '../lib/fields';
import { formatTime } from '../lib/format';
import { Markdown } from '../ui/Markdown';
import { FieldRow } from './FieldInput';

interface PanelState {
  task: TaskFull;
  draft: TaskDraft;
}

export interface TaskPanelProps {
  board: BoardInfo;
  taskId: string;
  version: number;
  onClose(): void;
  onError(message: string): void;
}

/** Новая версия задачи с сервера не затирает несохранённые правки. */
const mergeFresh = (prev: PanelState | null, next: TaskFull): PanelState =>
  prev && prev.task.id === next.id && isDirty(prev.task, prev.draft)
    ? { task: next, draft: prev.draft }
    : { task: next, draft: toDraft(next) };

export function TaskPanel({ board, taskId, version, onClose, onError }: TaskPanelProps) {
  const [state, setState] = useState<PanelState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const titleId = useId();

  useEffect(() => {
    let alive = true;
    api.task(taskId).then(
      (next) => {
        if (!alive) return;
        setLoadError(null);
        setState((prev) => mergeFresh(prev, next));
      },
      (e: unknown) => {
        if (alive) setLoadError(errorMessage(e));
      },
    );
    return () => {
      alive = false;
    };
  }, [taskId, version]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setDraft = (patch: Partial<TaskDraft>): void =>
    setState((prev) => prev && { ...prev, draft: { ...prev.draft, ...patch } });
  const setField = (id: string, value: FieldValue | null): void =>
    setState((prev) => prev && { ...prev, draft: { ...prev.draft, fields: { ...prev.draft.fields, [id]: value } } });

  const run = async (action: () => Promise<TaskFull>): Promise<void> => {
    setSaving(true);
    try {
      const updated = await action();
      setState((prev) => mergeFresh(prev, updated));
    } catch (e) {
      onError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const save = (): void => {
    if (!state) return;
    const update = buildUpdate(state.task, state.draft);
    void run(async () => {
      const updated = await api.update(state.task.id, update);
      setState({ task: updated, draft: toDraft(updated) });
      setEditingDescription(false);
      return updated;
    });
  };

  const submitNote = (e: FormEvent): void => {
    e.preventDefault();
    if (!state || note.trim() === '') return;
    void run(async () => {
      const updated = await api.addNote(state.task.id, note);
      setNote('');
      return updated;
    });
  };

  const moveTo = (to: string): void => {
    if (!state || to === state.task.column) return;
    void run(() => api.move(state.task.id, to));
  };

  const column = state ? board.columns.find((c) => c.id === state.task.column) : undefined;

  return (
    <>
      <div className="panel-backdrop" onMouseDown={onClose} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="panel-head">
          <span id={titleId} className="panel-id">
            {taskId}
          </span>
          {state?.task.agent && (
            <span className="panel-agent" title="Тип сабагента">
              · {state.task.agent}
            </span>
          )}
          {state && (
            <select
              className="control panel-move"
              aria-label="Колонка"
              value={state.task.column}
              disabled={saving}
              onChange={(e) => moveTo(e.target.value)}
            >
              {!column && <option value={state.task.column}>{state.task.column} (нет в board.yaml)</option>}
              {board.columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="button" onClick={onClose} aria-label="Закрыть панель">
            Esc
          </button>
        </header>
        {loadError && <p className="banner banner-error">{loadError}</p>}
        {state && (
          <>
            <div className="panel-body">
              {state.task.errors.length > 0 && (
                <ul className="error-list">
                  {state.task.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
              <input className="panel-title" aria-label="Название" value={state.draft.title} onChange={(e) => setDraft({ title: e.target.value })} />
              <section className="panel-section">
                <h3>Поля</h3>
                <div className="fields-grid">
                  <FieldRow
                    def={ASSIGNEE_FIELD}
                    value={state.draft.assignee || undefined}
                    onChange={(v) => setDraft({ assignee: typeof v === 'string' ? v : '' })}
                  />
                  {board.fields.map((f) => (
                    <FieldRow key={f.id} def={f} value={state.draft.fields[f.id] ?? undefined} onChange={(v) => setField(f.id, v)} />
                  ))}
                </div>
              </section>
              <section className="panel-section">
                <h3>
                  Описание{' '}
                  <button type="button" className="link-button" onClick={() => setEditingDescription((v) => !v)}>
                    {editingDescription ? 'просмотр' : 'редактировать'}
                  </button>
                </h3>
                {editingDescription ? (
                  <textarea
                    className="control"
                    rows={10}
                    aria-label="Описание"
                    value={state.draft.description}
                    onChange={(e) => setDraft({ description: e.target.value })}
                  />
                ) : state.draft.description ? (
                  <Markdown source={state.draft.description} />
                ) : (
                  <p className="description-empty">Описания нет.</p>
                )}
              </section>
              <section className="panel-section">
                <h3>Notes</h3>
                {state.task.notes.length === 0 ? (
                  <p className="description-empty">Заметок нет.</p>
                ) : (
                  <ol className="timeline">
                    {state.task.notes.map((n, i) => (
                      <li key={`${n.at}-${i}`}>
                        <time dateTime={n.at}>{formatTime(n.at)}</time>
                        <span>
                          <strong>{n.by}</strong>: {n.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
                <form className="note-form" onSubmit={submitNote}>
                  <input className="control" aria-label="Новая заметка" placeholder="Заметка" value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="button" type="submit" disabled={saving || note.trim() === ''}>
                    Добавить
                  </button>
                </form>
              </section>
              <section className="panel-section">
                <h3>История</h3>
                <ol className="timeline">
                  {state.task.history.map((h, i) => (
                    <li key={`${h.at}-${i}`}>
                      <time dateTime={h.at}>{formatTime(h.at)}</time>
                      <span>
                        <strong>{h.by}</strong>: {h.from === null ? `создал в ${h.to}` : `${h.from} → ${h.to}`}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <footer className="panel-foot">
              <button type="button" className="button button-primary" disabled={saving || !isDirty(state.task, state.draft)} onClick={save}>
                Сохранить
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
