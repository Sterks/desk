import { isAbsolute, relative, resolve } from 'node:path';
import { DeskError, isDeskError } from './errors.js';
import { loadProject, type Project } from './project.js';

export interface WorkspaceContext {
  tenantId: string;
  projectId: string;
  root: string;
  actor: string;
  project: Project;
}

export async function createWorkspaceContext(root: string, actor: string): Promise<WorkspaceContext> {
  const project = await loadProject(root);
  return { tenantId: project.tenantId, projectId: project.projectId, root: resolve(root), actor, project };
}

export function assertWorkspacePath(context: WorkspaceContext, candidate: string): string {
  const absolute = resolve(candidate);
  const rel = relative(context.root, absolute);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith('../') || rel.startsWith('..\\')) {
    throw new DeskError('BAD_REQUEST', `Путь выходит за пределы проекта ${context.tenantId}/${context.projectId}`);
  }
  return absolute;
}

/**
 * Результат попытки построить workspace: либо контекст, либо запомненная DeskError
 * (например, сломанный `project.yaml`). Используется, чтобы сервер не падал на старте —
 * см. `loadWorkspace`.
 */
export interface WorkspaceResult {
  workspace?: WorkspaceContext;
  error?: DeskError;
}

/** Как createWorkspaceContext, но ловит DeskError вместо того, чтобы бросать её наружу. */
export async function loadWorkspace(root: string, actor: string): Promise<WorkspaceResult> {
  try {
    return { workspace: await createWorkspaceContext(root, actor) };
  } catch (e) {
    if (!isDeskError(e)) throw e;
    return { error: e };
  }
}

/**
 * Возвращает workspace или бросает ошибку: запомненную (если project.yaml сломан),
 * иначе свежую INVALID_BOARD (нет .desk/ вовсе). Используется project-зависимыми
 * инструментами и маршрутами, чтобы никогда не отвечать пустым/дефолтным успехом.
 */
export function requireWorkspace(workspace: WorkspaceContext | undefined, error: DeskError | undefined): WorkspaceContext {
  if (workspace) return workspace;
  if (error) throw error;
  throw new DeskError('INVALID_BOARD', 'Project context недоступен: нет .desk/project.yaml. Запусти desk init в корне проекта.');
}
