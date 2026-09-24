import { useCallback, useState } from 'react';
import { Board } from './board/Board';
import { FilterBar } from './filters/FilterBar';
import { useBoardData } from './hooks/useBoardData';
import { useProject } from './hooks/useProject';
import { useUrlFilters } from './hooks/useUrlFilters';
import { applyFilters } from './lib/filters';
import { CreateTaskDialog } from './task-panel/CreateTaskDialog';
import { TaskPanel } from './task-panel/TaskPanel';
import { Banners } from './ui/Banners';
import { ToastStack, useToasts } from './ui/Toast';

export function App() {
  const { board, list, error, version, refresh } = useBoardData();
  const project = useProject();
  const [filters, setFilters] = useUrlFilters();
  const { items: toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const [creating, setCreating] = useState(false);
  const openTask = useCallback((id: string) => setFilters({ task: id }), [setFilters]);
  const closeTask = useCallback(() => setFilters({ task: null }), [setFilters]);

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
        <Board board={board} tasks={visible} onOpen={openTask} />
      </main>
      {filters.task && <TaskPanel board={board} taskId={filters.task} version={version} onClose={closeTask} onError={pushToast} />}
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
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </div>
  );
}
