import { useCallback, useRef, useState } from 'react';

export interface ToastItem {
  id: number;
  kind: 'error' | 'info';
  text: string;
}

const TOAST_MS = 6000;

export function useToasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (text: string, kind: ToastItem['kind'] = 'error') => {
      const id = nextId.current;
      nextId.current += 1;
      setItems((prev) => [...prev, { id, kind, text }]);
      window.setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );
  return { items, push, dismiss };
}

export function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss(id: number): void }) {
  return (
    <div className="toasts" role="status" aria-live="polite" aria-label="Уведомления">
      {items.map((toast) => (
        <div key={toast.id} className="toast" data-kind={toast.kind}>
          <span>{toast.text}</span>
          <button type="button" aria-label="Закрыть уведомление" onClick={() => onDismiss(toast.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
