import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'zod';
import { DeskError } from './errors.js';
import { projectPath } from './paths.js';

const ID = z.string().regex(/^[a-z][a-z0-9_-]*$/, 'идентификатор: строчные латинские буквы, цифры, _ и -, начинается с буквы');
const projectSchema = z
  .object({ version: z.literal(1), tenant_id: ID, project_id: ID, name: z.string().min(1).optional(), guide: z.string().optional() })
  .strict();

export interface Project {
  version: 1;
  tenantId: string;
  projectId: string;
  name: string;
  guide?: string;
  legacy: boolean;
}

function slug(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return /^[a-z]/.test(normalized) ? normalized : `project-${normalized || 'local'}`;
}

export function legacyProject(root: string): Project {
  const projectId = slug(basename(root));
  return { version: 1, tenantId: 'local', projectId, name: basename(root) || projectId, legacy: true };
}

export function parseProject(text: string): Project {
  let raw: unknown;
  try {
    raw = parseDocument(text, { prettyErrors: false }).toJS();
  } catch (e) {
    throw new DeskError('INVALID_BOARD', `project.yaml: ${e instanceof Error ? e.message : String(e)}`);
  }

  const result = projectSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? issue.path.join('.') : 'корень';
    throw new DeskError('INVALID_BOARD', `project.yaml: ${path}: ${issue?.message ?? 'неверная схема'}`);
  }

  return {
    version: 1,
    tenantId: result.data.tenant_id,
    projectId: result.data.project_id,
    name: result.data.name ?? result.data.project_id,
    guide: result.data.guide,
    legacy: false,
  };
}

export async function loadProject(root: string): Promise<Project> {
  try {
    return parseProject(await readFile(projectPath(root), 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return legacyProject(root);
    throw e;
  }
}

export function projectTemplate(root: string): string {
  const project = legacyProject(root);
  return `version: 1\ntenant_id: local\nproject_id: ${project.projectId}\nname: ${JSON.stringify(project.name)}\n`;
}
