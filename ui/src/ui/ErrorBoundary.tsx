import { Component, type ErrorInfo, type ReactNode } from 'react';
import { errorMessage } from '../api/client';

export interface ErrorBoundaryProps {
  /** Что показать вместо упавшего поддерева. */
  fallback(message: string): ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

/**
 * Ошибка отрисовки не должна оставлять пустую страницу (спека 3.6: битые данные не ломают доску).
 * Сбрасывается сменой `key` у границы (например, при открытии другой задачи).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: errorMessage(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // В браузере нет серверного лога: консоль — единственное место для стека компонентов.
    console.error('desk ui: ошибка отрисовки', error, info.componentStack);
  }

  render(): ReactNode {
    return this.state.message === null ? this.props.children : this.props.fallback(this.state.message);
  }
}
