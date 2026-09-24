import { Board } from './board/Board';
import { useBoardData } from './hooks/useBoardData';
import { Banners } from './ui/Banners';

export function App() {
  const { board, list, error } = useBoardData();
  if (!board || !list) return <main className="app-state">{error ?? 'Загрузка доски…'}</main>;
  const noop = (): void => undefined;
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-mark" aria-hidden="true">▦</span>
          <h1>{board.name}</h1>
        </div>
      </header>
      <Banners board={board} list={list} error={error} onOpen={noop} />
      <main className="app-main">
        <Board board={board} tasks={list.tasks} onOpen={noop} />
      </main>
    </div>
  );
}
