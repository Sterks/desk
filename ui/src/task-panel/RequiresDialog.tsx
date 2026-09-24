import { useState } from 'react';
import { errorMessage, type FieldChanges } from '../api/client';
import type { BoardInfo, TaskItem } from '../api/types';
import { compactFields, fieldInfo, type Draft } from '../lib/fields';
import { isEmptyValue } from '../lib/transitions';
import { Modal } from '../ui/Modal';
import { FieldRow } from './FieldInput';

export interface RequiresDialogProps {
  board: BoardInfo;
  task: TaskItem;
  to: string;
  missing: string[];
  onCancel(): void;
  onSubmit(fields: FieldChanges): Promise<void>;
}

export function RequiresDialog({ board, task, to, missing, onCancel, onSubmit }: RequiresDialogProps) {
  const [values, setValues] = useState<Draft>(() => Object.fromEntries(missing.map((id) => [id, null])));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const target = board.columns.find((c) => c.id === to)?.title ?? to;
  const complete = missing.every((id) => !isEmptyValue(values[id]));

  const submit = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      await onSubmit(compactFields(values));
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${task.id} → ${target}`}
      description="Этот переход требует заполнить поля."
      onClose={onCancel}
      onSubmit={() => void submit()}
      footer={
        <>
          <button type="button" className="button" onClick={onCancel}>
            Отмена
          </button>
          <button type="submit" className="button button-primary" disabled={!complete || saving}>
            Перенести
          </button>
        </>
      }
    >
      {missing.map((id) => {
        const def = fieldInfo(board, id);
        return def ? (
          <FieldRow key={id} def={def} value={values[id] ?? undefined} onChange={(v) => setValues((prev) => ({ ...prev, [id]: v }))} />
        ) : null;
      })}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
