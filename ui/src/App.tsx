import { useCallback, useState } from 'react';
import { api, errorMessage, type FieldChanges } from './api/client';
import type { TaskItem } from './api/types';
import { Board } from './board/Board';
import { FilterBar } from './filters/FilterBar';
import { useBoardData } from './hooks/useBoardData';
import { useProject } from './hooks/useProject';
import { useUrlFilters } from './hooks/useUrlFilters';
import { applyFilters } from './lib/filters';
import { missingForMove } from './lib/transitions';
import { CreateTaskDialog } from './task-panel/CreateTaskDialog';
import { RequiresDialog } from './task-panel/RequiresDialog';
import { TaskPanel, TaskPanelCrash } from './task-panel/TaskPanel';
import { Banners } from './ui/Banners';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { ToastStack, useToasts } from './ui/Toast';

interface PendingMove {
  task: TaskItem;
  to: string;
  missing: string[];
}

export function App() {
  const { board, list, error, version, refresh } = useBoardData();
  const project = useProject();
  const [filters, setFilters] = useUrlFilters();
  const { items: toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const [creating, setCreating] = useState(false);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const openTask = useCallback((id: string) => setFilters({ task: id }), [setFilters]);
  const closeTask = useCallback(() => setFilters({ task: null }), [setFilters]);

  const performMove = useCallback(
    async (id: string, to: string, fields: FieldChanges) => {
      await api.move(id, to, fields);
      await refresh();
    },
    [refresh],
  );

  const handleMove = useCallback(
    (task: TaskItem, to: string) => {
      if (!board) return;
      const missing = missingForMove(board, task, to);
      if (missing.length > 0) {
        setPendingMove({ task, to, missing });
        return;
      }
      performMove(task.id, to, {}).catch((e: unknown) => pushToast(errorMessage(e)));
    },
    [board, performMove, pushToast],
  );

  if (!board || !list) return <main className="app-state">{error ?? 'Загрузка доски…'}</main>;
  const visible = applyFilters(list.tasks, filters);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-mark" aria-hidden="true">▦</span>
          <h1>{board.name}</h1>
          {project && <span className="app-project">{project.name}</span>}
        </div>
        <FilterBar board={board} tasks={list.tasks} filters={filters} onChange={setFilters} onCreate={() => setCreating(true)} />
      </header>
      <Banners board={board} list={list} error={error} onOpen={openTask} />
      <main className="app-main">
        <Board board={board} tasks={visible} onOpen={openTask} onMove={handleMove} />
      </main>
      {filters.task && (
        <ErrorBoundary key={filters.task} fallback={(message) => <TaskPanelCrash taskId={filters.task ?? ''} message={message} onClose={closeTask} />}>
          <TaskPanel board={board} taskId={filters.task} version={version} onClose={closeTask} onError={pushToast} onMove={handleMove} />
        </ErrorBoundary>
      )}
      {creating && (
        <CreateTaskDialog
          board={board}
          onClose={() => setCreating(false)}
          onCreated={(task) => {
            setCreating(false);
            void refresh();
            openTask(task.id);
          }}
        />
      )}
      {pendingMove && (
        <RequiresDialog
          board={board}
          task={pendingMove.task}
          to={pendingMove.to}
          missing={pendingMove.missing}
          onCancel={() => setPendingMove(null)}
          onSubmit={async (fields) => {
            await performMove(pendingMove.task.id, pendingMove.to, fields);
            setPendingMove(null);
          }}
        />
      )}
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
