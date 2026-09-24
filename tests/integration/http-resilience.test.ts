import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { startHttpServer, type RunningHttpServer } from '../../src/http/server.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';
import { rawRequest } from '../helpers/http.js';

async function makeStaticDir(): Promise<string> {
  const staticDir = join(await makeEmptyDir(), 'ui');
  await mkdir(staticDir);
  await writeFile(join(staticDir, 'index.html'), '<!doctype html><title>desk</title>');
  return staticDir;
}

async function makeProjectWithBrokenYaml(yaml: string): Promise<string> {
  const root = await makeProject();
  await mkdir(join(root, '.desk'), { recursive: true });
  await writeFile(join(root, '.desk', 'project.yaml'), yaml);
  return root;
}

async function withServer<T>(
  opts: Partial<Parameters<typeof startHttpServer>[0]> & { cwd: string },
  fn: (server: RunningHttpServer) => Promise<T>,
): Promise<T> {
  const server = await startHttpServer({ port: 0, staticDir: await makeStaticDir(), actor: 'http-test', env: {}, clock: fixedClock(), ...opts });
  await server.ready;
  try {
    return await fn(server);
  } finally {
    await server.close();
  }
}

describe('A1: startHttpServer не должен падать на сломанном project.yaml', () => {
  it.each([
    ['битый YAML', 'version: 1\ntenant_id: [\n'],
    ['нарушение схемы: нет tenant_id', 'version: 1\nproject_id: demo\n'],
  ])('%s — сервер стартует, /api/board работает, /api/project — 500 INVALID_BOARD', async (_label, yaml) => {
    const root = await makeProjectWithBrokenYaml(yaml);
    await withServer({ cwd: root }, async (server) => {
      const api = (r: Parameters<typeof rawRequest>[1]) => rawRequest(server.port, r);
      expect((await api({ path: '/api/board' })).status).toBe(200);
      const projectRes = await api({ path: '/api/project' });
      expect(projectRes.status).toBe(500);
      expect(projectRes.json()).toMatchObject({ ok: false, error: { code: 'INVALID_BOARD' } });
    });
  });
});

describe('A2: без .desk совсем — project-маршруты не выдают пустой успех', () => {
  it('GET /api/project и /api/projects возвращают 500 INVALID_BOARD, не {projects: []}', async () => {
    const root = await makeEmptyDir();
    await withServer({ cwd: root }, async (server) => {
      const api = (r: Parameters<typeof rawRequest>[1]) => rawRequest(server.port, r);
      const project = await api({ path: '/api/project' });
      expect(project.status).toBe(500);
      expect(project.json()).toMatchObject({ ok: false, error: { code: 'INVALID_BOARD' } });
      const projects = await api({ path: '/api/projects' });
      expect(projects.status).toBe(500);
      expect(projects.json()).toMatchObject({ ok: false, error: { code: 'INVALID_BOARD' } });
    });
  });
});

describe('A3: test-reset больше не открыт через переменную окружения', () => {
  it('DESK_E2E=1 в env без опции testReset — /api/test/reset недоступен (404)', async () => {
    const root = await makeProject();
    await withServer({ cwd: root, env: { DESK_E2E: '1' } }, async (server) => {
      const res = await rawRequest(server.port, { method: 'POST', path: '/api/test/reset' });
      expect(res.status).toBe(404);
    });
  });

  it('testReset: true в опциях — маршрут работает и удаляет задачи', async () => {
    const root = await makeProject();
    await withServer({ cwd: root, testReset: true }, async (server) => {
      const api = (r: Parameters<typeof rawRequest>[1]) => rawRequest(server.port, r);
      const created = await api({ method: 'POST', path: '/api/tasks', body: { title: 'to be wiped' } });
      expect(created.json()).toMatchObject({ ok: true, data: { id: 'T-001' } });
      const reset = await api({ method: 'POST', path: '/api/test/reset' });
      expect(reset.status).toBe(200);
      const list = await api({ path: '/api/tasks' });
      expect(list.json<{ data: { total: number } }>()).toMatchObject({ data: { total: 0 } });
    });
  });

  it('testReset не задан (по умолчанию falsy) — маршрут недоступен, даже без DESK_E2E', async () => {
    const root = await makeProject();
    await withServer({ cwd: root }, async (server) => {
      const res = await rawRequest(server.port, { method: 'POST', path: '/api/test/reset' });
      expect(res.status).toBe(404);
    });
  });
});
