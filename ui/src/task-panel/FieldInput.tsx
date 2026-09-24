import { useId } from 'react';
import type { FieldInfo, FieldValue } from '../api/types';
import { parseNumberInput } from '../lib/fields';

export interface FieldInputProps {
  def: FieldInfo;
  value: FieldValue | undefined;
  onChange(value: FieldValue | null): void;
  inputId: string;
}

const textValue = (value: FieldValue | undefined): string => (typeof value === 'string' ? value : '');
const orNull = (text: string): string | null => (text === '' ? null : text);

export function FieldInput({ def, value, onChange, inputId }: FieldInputProps) {
  switch (def.type) {
    case 'enum':
      return (
        <select id={inputId} className="control" value={textValue(value)} onChange={(e) => onChange(orNull(e.target.value))}>
          <option value="">—</option>
          {def.values?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
    case 'multi_enum': {
      const current = Array.isArray(value) ? value : [];
      return (
        <fieldset id={inputId} className="multi">
          {def.values?.map((v) => (
            <label key={v}>
              <input
                type="checkbox"
                checked={current.includes(v)}
                onChange={(e) => {
                  const next = e.target.checked ? [...current, v] : current.filter((x) => x !== v);
                  onChange(next.length > 0 ? next : null);
                }}
              />
              {v}
            </label>
          ))}
        </fieldset>
      );
    }
    case 'bool':
      return <input id={inputId} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />;
    case 'number':
      return (
        <input
          id={inputId}
          className="control"
          type="number"
          value={typeof value === 'number' ? value : ''}
          min={def.min ?? undefined}
          max={def.max ?? undefined}
          onChange={(e) => onChange(parseNumberInput(e.target.value))}
        />
      );
    case 'text':
      return <textarea id={inputId} className="control" rows={4} value={textValue(value)} onChange={(e) => onChange(orNull(e.target.value))} />;
    default:
      return (
        <input
          id={inputId}
          className="control"
          type={def.type === 'url' ? 'url' : def.type === 'date' ? 'date' : 'text'}
          value={textValue(value)}
          onChange={(e) => onChange(orNull(e.target.value))}
        />
      );
  }
}

export function FieldRow({ def, value, onChange }: Omit<FieldInputProps, 'inputId'>) {
  // useId: окно requires открывается поверх панели с теми же полями — id не должны совпадать.
  const inputId = `field-${def.id}-${useId()}`;
  return (
    <div className="field-row">
      <label htmlFor={inputId}>
        {def.id}
        {def.required && <span className="field-required" aria-label="обязательное"> *</span>}
      </label>
      <FieldInput def={def} value={value} onChange={onChange} inputId={inputId} />
      {def.guide && <p className="field-guide">{def.guide}</p>}
    </div>
  );
}
