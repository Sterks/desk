import { taskPath, lockPath } from './paths.js';
import { loadBoard } from './board-loader.js';
import { loadProject, type Project } from './project.js';
import { loadAll } from './task-store.js';
import type { Board, LoadedTask } from './types.js';
import { assertWorkspacePath, type WorkspaceContext } from './workspace.js';

export interface DeskRepository {
  readonly context: WorkspaceContext;
  loadBoard(): Promise<Board>;
  loadProject(): Promise<Project>;
  loadTasks(board?: Board): Promise<LoadedTask[]>;
  taskPath(id: string): string;
  lockPath(): string;
}

export class FileDeskRepository implements DeskRepository {
  constructor(readonly context: WorkspaceContext) {}
  loadBoard(): Promise<Board> { return loadBoard(this.context.root); }
  loadProject(): Promise<Project> { return loadProject(this.context.root); }
  async loadTasks(board?: Board): Promise<LoadedTask[]> { return loadAll(this.context.root, board ?? await this.loadBoard()); }
  taskPath(id: string): string { return assertWorkspacePath(this.context, taskPath(this.context.root, id)); }
  lockPath(): string { return assertWorkspacePath(this.context, lockPath(this.context.root)); }
}

export function createFileDeskRepository(context: WorkspaceContext): DeskRepository { return new FileDeskRepository(context); }
