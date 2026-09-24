import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: string;
  description?: string;
  onClose(): void;
  onSubmit(): void;
  footer: ReactNode;
  children: ReactNode;
}

export function Modal({ title, description, onClose, onSubmit, footer, children }: ModalProps) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
