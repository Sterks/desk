import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createBoardHolder, type BoardHolder } from '../core/board-holder.js';
import { isDeskError } from '../core/errors.js';
import type { Clock } from '../core/types.js';
import { watchDesk } from '../core/watch.js';
import { VERSION } from '../version.js';
import { toolDefinitions } from './input-schema.js';
import { callTool } from './tools.js';
import { loadWorkspace } from '../core/workspace.js';

export const INSTRUCTIONS =
  'Это канбан-доска проекта. Сначала вызови get_board и следуй guide доски, колонок и полей. ' +
  'В actor передавай своё имя агента. При ошибке читай code, guide и allowed и исправляй вызов.';

export interface DeskMcp {
  server: Server;
  holder: BoardHolder;
  ready: Promise<void>;
  close(): Promise<void>;
}

export interface DeskMcpOptions {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  watch?: boolean;
  clock?: Clock;
}

const text = (value: unknown): { type: 'text'; text: string } => ({ type: 'text', text: JSON.stringify(value, null, 2) });

// Каждый outputSchema объявлен с корнем type:"object" — structuredContent обязан ему
// соответствовать. Все текущие callTool-ветки и правда возвращают объект (см. tools.ts),
// но её тип — Promise<unknown>, так что защита рантайм-проверкой дешевле, чем полагаться
// на то, что будущая ветка не вернёт массив/примитив.
const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export async function createDeskMcp(opts: DeskMcpOptions): Promise<DeskMcp> {
  const holder = await createBoardHolder(opts.cwd, opts.env ?? process.env);
  // project.yaml меняется гораздо реже board.yaml, поэтому читаем его один раз при старте
  // (как и board.yaml, ошибка не должна убивать процесс — она просто запоминается и
  // возвращается из project-зависимых tools при каждом вызове, см. requireWorkspace).
  const { workspace, error: workspaceError } = holder.root === null ? {} : await loadWorkspace(holder.requireRoot(), 'mcp-agent');
  const server = new Server(
    { name: 'desk', version: VERSION },
    { capabilities: { tools: { listChanged: true } }, instructions: INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: toolDefinitions(holder.current()) }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const data = await callTool({ holder, clock: opts.clock, workspace, workspaceError }, request.params.name, request.params.arguments);
      return { content: [text(data)], ...(isPlainObject(data) ? { structuredContent: data } : {}) };
    } catch (e) {
      if (isDeskError(e)) return { isError: true, content: [text(e.toJSON())] };
      process.stderr.write(`desk mcp: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}\n`);
      throw e;
    }
  });

  const watcher =
    opts.watch !== false && holder.root !== null
      ? watchDesk(holder.root, (event) => {
          if (event.type !== 'board_changed') return;
          void holder
            .reload()
            .then((result) => (result === 'changed' ? server.sendToolListChanged() : undefined))
            .catch((e: unknown) => {
              process.stderr.write(`desk mcp: не удалось перечитать board.yaml: ${String(e)}\n`);
            });
        })
      : null;

  return {
    server,
    holder,
    ready: watcher?.ready ?? Promise.resolve(),
    close: async () => {
      await watcher?.close();
      await server.close();
    },
  };
}

export async function runStdio(cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
  const mcp = await createDeskMcp({ cwd, env });
  await mcp.server.connect(new StdioServerTransport());
}
