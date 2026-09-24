import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: string;
  description?: string;
  onClose(): void;
  onSubmit(): void;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * Окно requires открывается прямо из onDragEnd. PointerSensor из @dnd-kit ещё 50 мс после броска
 * держит на document обработчик selectionchange → removeAllRanges(): если сфокусировать поле
 * раньше, фокус в нём есть, а каретки нет, и ввод с клавиатуры теряется. Фокусируем позже.
 * Значение завязано на внутренности @dnd-kit/core 6.3.1 (`setTimeout(this.documentListeners.removeAll, 50)`
 * в AbstractPointerSensor.detach); версия закреплена в package.json без `^` — при обновлении
 * dnd-kit перепроверь эту константу (E2E «перенос без assignee…» ловит регрессию).
 */
const INITIAL_FOCUS_DELAY_MS = 80;

export function Modal({ title, description, onClose, onSubmit, footer, children }: ModalProps) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      formRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    }, INITIAL_FOCUS_DELAY_MS);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      // Фаза capture и preventDefault: панель задачи под окном не должна закрыться тем же Escape.
      e.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        ref={formRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          {description && <p>{description}</p>}
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-foot">{footer}</footer>
      </form>
    </div>
  );
}
