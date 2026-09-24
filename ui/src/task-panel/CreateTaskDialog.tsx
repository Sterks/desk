import { useState } from 'react';
import { api, errorMessage } from '../api/client';
import type { BoardInfo, TaskFull } from '../api/types';
import { ASSIGNEE_FIELD, compactFields, defaultsFor, type Draft } from '../lib/fields';
import { Modal } from '../ui/Modal';
import { FieldRow } from './FieldInput';

export interface CreateTaskDialogProps {
  board: BoardInfo;
  onClose(): void;
  onCreated(task: TaskFull): void;
}

export function CreateTaskDialog({ board, onClose, onCreated }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState(board.columns[0]?.id ?? '');
  const [assignee, setAssignee] = useState('');
  const [fields, setFields] = useState<Draft>(() => defaultsFor(board));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const created = await api.create({
        title,
        description,
        column,
        fields: { ...compactFields(fields), ...(assignee.trim() ? { assignee: assignee.trim() } : {}) },
      });
      onCreated(created);
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Новая задача"
      onClose={onClose}
      onSubmit={() => void submit()}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={saving || title.trim() === ''}>
            Создать
          </button>
        </>
      }
    >
      <div className="field-row">
        <label htmlFor="new-title">
          title <span className="field-required">*</span>
        </label>
        <input id="new-title" className="control" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field-row">
        <label htmlFor="new-column">column</label>
        <select id="new-column" className="control" value={column} onChange={(e) => setColumn(e.target.value)}>
          {board.columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <FieldRow def={ASSIGNEE_FIELD} value={assignee || undefined} onChange={(v) => setAssignee(typeof v === 'string' ? v : '')} />
      {board.fields.map((f) => (
        <FieldRow key={f.id} def={f} value={fields[f.id] ?? undefined} onChange={(v) => setFields((prev) => ({ ...prev, [f.id]: v }))} />
      ))}
      <div className="field-row">
        <label htmlFor="new-description">description</label>
        <textarea id="new-description" className="control" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
