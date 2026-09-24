import { readFile, writeFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boardPath } from '../../src/core/paths.js';
import { INSTRUCTIONS, createDeskMcp, type DeskMcp } from '../../src/mcp/server.js';
import { fixedClock, makeEmptyDir, makeProject } from '../helpers/project.js';

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

describe('desk MCP server', () => {
  it('отдаёт instructions и 7 tools', async () => {
    const { client } = await connect(await makeProject());
    expect(client.getInstructions()).toBe(INSTRUCTIONS);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toContain('move_task');
  });

  it('успех — JSON в text content', async () => {
    const { client } = await connect(await makeProject());
    const result = await client.callTool({ name: 'create_task', arguments: { actor: 'planner', title: 'Через MCP' } });
    expect((result as ToolResult).isError).toBeFalsy();
    expect(payload(result)).toMatchObject({ id: 'T-001', title: 'Через MCP' });
  });

  it('ошибка — isError и JSON ошибки с guide', async () => {
    const { client } = await connect(await makeProject());
    await client.callTool({ name: 'create_task', arguments: { actor: 'planner', title: 'X' } });
    const result = await client.callTool({ name: 'move_task', arguments: { actor: 'dev', id: 'T-001', to: 'in_progress' } });
    expect((result as ToolResult).isError).toBe(true);
    expect(payload(result)).toMatchObject({ code: 'TRANSITION_REQUIRES', field: 'assignee' });
  });

  it('правка board.yaml → notifications/tools/list_changed и новая схема', async () => {
    const root = await makeProject();
    const { client } = await connect(root);
    const notified = vi.fn();
    client.setNotificationHandler(ToolListChangedNotificationSchema, async () => notified());
    const text = await readFile(boardPath(root), 'utf8');
    await writeFile(boardPath(root), text.replace('values: [p0, p1, p2, p3]', 'values: [p0, p1, p2, p3, p4]'));
    await vi.waitFor(() => expect(notified).toHaveBeenCalled(), { timeout: 3000 });
    const { tools } = await client.listTools();
    const create = tools.find((t) => t.name === 'create_task');
    const fields = (create?.inputSchema.properties as Record<string, { properties: Record<string, { enum: string[] }> }>).fields;
    expect(fields?.properties.priority?.enum).toContain('p4');
  });

  it('сломанный board.yaml после старта: запись INVALID_BOARD, чтение работает', async () => {
    const root = await makeProject();
    const { client, mcp } = await connect(root);
    await writeFile(boardPath(root), 'version: 1\ncolumns: [\n');
    await vi.waitFor(async () => {
      await mcp.holder.reload();
      const result = await client.callTool({ name: 'create_task', arguments: { actor: 'a', title: 'X' } });
      expect(payload(result)).toMatchObject({ code: 'INVALID_BOARD' });
    }, { timeout: 3000 });
    const list = await client.callTool({ name: 'list_tasks', arguments: {} });
    expect((list as ToolResult).isError).toBeFalsy();
  });

  it('без .desk: tools есть, вызовы — INVALID_BOARD с подсказкой', async () => {
    const { client } = await connect(await makeEmptyDir());
    expect((await client.listTools()).tools).toHaveLength(7);
    const result = await client.callTool({ name: 'get_board', arguments: {} });
    expect(payload(result)).toMatchObject({ code: 'INVALID_BOARD' });
    expect(String(payload(result).message)).toContain('desk init');
  });
});
