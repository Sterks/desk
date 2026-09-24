import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createDeskMcp, type DeskMcp } from '../../src/mcp/server.js';
import { fixedClock, makeProject } from '../helpers/project.js';

const open: DeskMcp[] = [];
afterEach(async () => {
  await Promise.all(open.splice(0).map((m) => m.close()));
});

async function connect(cwd: string): Promise<{ client: Client; mcp: DeskMcp }> {
  const mcp = await createDeskMcp({ cwd, env: {}, clock: fixedClock() });
  open.push(mcp);
  await mcp.ready;
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await mcp.server.connect(serverTransport);
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(clientTransport);
  return { client, mcp };
}

type ToolResult = { isError?: boolean; content: { type: string; text: string }[] };
const payload = (result: unknown): Record<string, unknown> => JSON.parse((result as ToolResult).content[0]?.text ?? 'null');

async function makeProjectWithBrokenYaml(yaml: string): Promise<string> {
  const root = await makeProject();
  await mkdir(join(root, '.desk'), { recursive: true });
  await writeFile(join(root, '.desk', 'project.yaml'), yaml);
  return root;
}

describe('A1: сервер не должен падать на сломанном project.yaml', () => {
  it.each([
    ['битый YAML', 'version: 1\ntenant_id: [\n'],
    ['нарушение схемы: нет tenant_id', 'version: 1\nproject_id: demo\n'],
  ])('%s — createDeskMcp резолвится, list_tools и board-инструменты работают, project-инструменты — INVALID_BOARD', async (_label, yaml) => {
    const root = await makeProjectWithBrokenYaml(yaml);
    const { client } = await connect(root);

    const { tools } = await client.listTools();
    expect(tools).toHaveLength(9);

    const board = await client.callTool({ name: 'get_board', arguments: {} });
    expect((board as ToolResult).isError).toBeFalsy();

    const created = await client.callTool({ name: 'create_task', arguments: { actor: 'a', title: 'X' } });
    expect((created as ToolResult).isError).toBeFalsy();
    expect(payload(created)).toMatchObject({ id: 'T-001' });

    const projects = await client.callTool({ name: 'list_projects', arguments: {} });
    expect((projects as ToolResult).isError).toBe(true);
    expect(payload(projects)).toMatchObject({ code: 'INVALID_BOARD' });

    const project = await client.callTool({ name: 'get_project', arguments: {} });
    expect((project as ToolResult).isError).toBe(true);
    expect(payload(project)).toMatchObject({ code: 'INVALID_BOARD' });
  });
});
