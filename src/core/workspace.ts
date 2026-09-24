import { isAbsolute, relative, resolve } from 'node:path';
import { DeskError } from './errors.js';
import { loadProject, type Project } from './project.js';

export interface WorkspaceContext { tenantId: string; projectId: string; root: string; actor: string; project: Project; }

export async function createWorkspaceContext(root: string, actor: string): Promise<WorkspaceContext> {
  const project = await loadProject(root);
  return { tenantId: project.tenantId, projectId: project.projectId, root: resolve(root), actor, project };
}

export function assertWorkspacePath(context: WorkspaceContext, candidate: string): string {
  const absolute = resolve(candidate);
  const rel = relative(context.root, absolute);
  if (isAbsolute(rel) || rel === '..' || rel.startsWith('../') || rel.startsWith('..\\')) throw new DeskError('BAD_REQUEST', `Путь выходит за пределы проекта ${context.tenantId}/${context.projectId}`);
  return absolute;
}
