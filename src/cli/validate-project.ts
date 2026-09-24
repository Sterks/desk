import { loadBoard } from '../core/board-loader.js';
import { isDeskError } from '../core/errors.js';
import { findDuplicateIds } from '../core/ids.js';
import { loadAll } from '../core/task-store.js';
import { loadProject } from '../core/project.js';
export async function validateProject(root: string): Promise<{ ok: boolean; lines: string[] }> { let board; let project; try { board = await loadBoard(root); project = await loadProject(root); } catch (e) { if (isDeskError(e)) return { ok: false, lines: [e.message] }; throw e; } const loaded = await loadAll(root, board); const lines = [...loaded.flatMap((item) => item.errors.map((error) => `${item.id}: ${error}`)), ...findDuplicateIds(loaded.map((item) => item.id)).map((group) => `дубликат ID: ${group.join(', ')}`)]; return lines.length ? { ok: false, lines } : { ok: true, lines: [`OK: board.yaml/project.yaml валидны (${project.tenantId}/${project.projectId}), задач: ${loaded.length}`] }; }
