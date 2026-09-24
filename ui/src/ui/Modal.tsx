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
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
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
