import type { BoardHolder } from '../core/board-holder.js';
import { DeskError, isDeskError, type ErrorCode } from '../core/errors.js';
import { presentTaskList } from '../core/present.js';
import type { TaskFilter } from '../core/query.js';
import { loadAll } from '../core/task-store.js';
import type { Clock } from '../core/types.js';
import type { WorkspaceContext } from '../core/workspace.js';
import { callTool } from '../mcp/tools.js';
import { loadProject } from '../core/project.js';
export interface ApiContext { holder: BoardHolder; actor: string; clock: Clock; workspace?: WorkspaceContext; }
export interface ApiResponse { status: number; body: unknown; }
const STATUS: Record<ErrorCode, number> = { BAD_REQUEST: 400, UNKNOWN_FIELD: 400, INVALID_VALUE: 400, REQUIRED_MISSING: 400, NOT_FOUND: 404, TRANSITION_FORBIDDEN: 409, TRANSITION_REQUIRES: 409, WIP_LIMIT: 409, LOCK_TIMEOUT: 503, INVALID_BOARD: 500 };
export function statusFor(code: ErrorCode): number { return STATUS[code]; }
export function normalizeApiUrl(ctx: ApiContext, url: URL): URL {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts[1] !== 'tenants') return url;
  if (parts[3] !== 'projects' || !ctx.workspace || parts[2] !== ctx.workspace.tenantId || parts[4] !== ctx.workspace.projectId) throw new DeskError('NOT_FOUND', `Маршрут ${url.pathname} не найден`);
  const normalized = new URL(url);
  const rest = parts.slice(5);
  normalized.pathname = `/api/${rest.length ? rest.join('/') : 'project'}`;
  return normalized;
}
export async function handleApi(ctx: ApiContext, method: string, url: URL, body: unknown): Promise<ApiResponse> { try { return { status: 200, body: { ok: true, data: await dispatch(ctx, method, normalizeApiUrl(ctx, url), body) } }; } catch (e) { if (isDeskError(e)) return { status: statusFor(e.code), body: { ok: false, error: e.toJSON() } }; throw e; } }
function asObject(body: unknown): Record<string, unknown> { if (body === undefined) return {}; if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new DeskError('BAD_REQUEST', 'Тело запроса должно быть JSON-объектом'); return body as Record<string, unknown>; }
async function listTasks(ctx: ApiContext, params: URLSearchParams): Promise<unknown> { const board = ctx.holder.read(); const pick = (key: string) => params.get(key) || undefined; const filter: TaskFilter = { column: pick('column'), assignee: pick('assignee'), query: pick('q') }; return presentTaskList(board, await loadAll(ctx.holder.requireRoot(), board), filter); }
async function dispatch(ctx: ApiContext, method: string, url: URL, body: unknown): Promise<unknown> { const tool = { holder: ctx.holder, clock: ctx.clock, workspace: ctx.workspace }; const [, resource, id, action, ...rest] = url.pathname.split('/').filter(Boolean); const route = rest.length > 0 ? 'unknown' : `${method} ${resource ?? ''}${id ? '/:id' : ''}${action ? `/${action}` : ''}`; const withActor = (extra: Record<string, unknown>) => ({ ...asObject(body), ...extra, actor: ctx.actor }); switch (route) { case 'GET project': { const project = ctx.workspace?.project ?? await loadProject(ctx.holder.requireRoot()); return { tenant_id: project.tenantId, project_id: project.projectId, name: project.name, guide: project.guide ?? null, legacy: project.legacy }; } case 'GET projects': { const project = ctx.workspace?.project ?? await loadProject(ctx.holder.requireRoot()); return { projects: [{ tenant_id: project.tenantId, project_id: project.projectId, name: project.name, legacy: project.legacy }] }; } case 'GET board': return callTool(tool, 'get_board', {}); case 'GET tasks': return listTasks(ctx, url.searchParams); case 'GET tasks/:id': return callTool(tool, 'get_task', { id }); case 'POST tasks': return callTool(tool, 'create_task', withActor({})); case 'PATCH tasks/:id': return callTool(tool, 'update_task', withActor({ id })); case 'POST tasks/:id/move': return callTool(tool, 'move_task', withActor({ id })); case 'POST tasks/:id/notes': return callTool(tool, 'add_note', withActor({ id })); default: throw new DeskError('NOT_FOUND', `Маршрут ${method} ${url.pathname} не найден`); } }
