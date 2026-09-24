import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it } from 'vitest';
import { readStream, runCli } from '../../src/cli/run.js';
import { BOARD_TEMPLATE } from '../../src/cli/templates.js';
import { hookIo as io } from '../helpers/hooks.js';
import { makeEmptyDir, makeProject } from '../helpers/project.js';

type Settings = { hooks: Record<string, { matcher?: string; hooks: { command: string }[] }[]> };
const settingsPath = (root: string): string => join(root, '.claude', 'settings.json');
const commands = (settings: Settings, event: string): string[] =>
  (settings.hooks[event] ?? []).flatMap((entry) => entry.hooks.map((h) => h.command));
const readSettings = async (root: string): Promise<Settings> => JSON.parse(await readFile(settingsPath(root), 'utf8'));
const hookCmd = (name: string) => [{ type: 'command', command: `desk hook ${name}`, timeout: 10 }];

describe('desk hooks install', () => {
  it('creates .claude/settings.json with all hook entries', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const x = io(root);
    expect(await runCli(['hooks', 'install'], x)).toBe(0);
    expect((await readSettings(root)).hooks).toEqual({
      PreToolUse: [{ matcher: 'Agent|Task', hooks: hookCmd('agent-start') }],
      SubagentStart: [{ hooks: hookCmd('agent-attach') }],
      PostToolUse: [{ matcher: 'Agent|Task', hooks: hookCmd('agent-end') }],
      PostToolUseFailure: [{ matcher: 'Agent|Task', hooks: hookCmd('agent-end') }],
      PermissionDenied: [{ matcher: 'Agent|Task', hooks: hookCmd('agent-end') }],
      SubagentStop: [{ hooks: hookCmd('agent-end') }],
    });
    expect(x.outLines.join('\n')).toContain('SubagentStart → desk hook agent-attach');
    expect(existsSync(`${settingsPath(root)}.tmp`)).toBe(false);
  });

  it('is idempotent and preserves unrelated settings and hooks', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    const existing = {
      permissions: { allow: ['Bash(ls)'] },
      hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] }], Stop: [{ hooks: [{ type: 'command', command: 'say done' }] }] },
    };
    await writeFile(settingsPath(root), JSON.stringify(existing));
    expect(await runCli(['hooks', 'install'], io(root))).toBe(0);
    const second = io(root);
    expect(await runCli(['hooks', 'install'], second)).toBe(0);
    const settings = await readSettings(root);
    expect((settings as unknown as typeof existing).permissions).toEqual(existing.permissions);
    expect(settings.hooks.Stop).toEqual(existing.hooks.Stop);
    expect(commands(settings, 'PreToolUse')).toEqual(['echo hi', 'desk hook agent-start']);
    for (const event of ['PostToolUse', 'PostToolUseFailure', 'PermissionDenied', 'SubagentStop']) {
      expect(commands(settings, event)).toEqual(['desk hook agent-end']);
    }
    expect(second.outLines.every((line) => line.includes('уже'))).toBe(true);
  });

  it('fails on invalid JSON and leaves the file untouched', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    await writeFile(settingsPath(root), '{ broken');
    const x = io(root);
    expect(await runCli(['hooks', 'install'], x)).toBe(1);
    expect(x.errLines.join()).toContain('settings.json');
    expect(await readFile(settingsPath(root), 'utf8')).toBe('{ broken');
  });

  it('fails when hooks has the wrong shape', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    await mkdir(join(root, '.claude'));
    await writeFile(settingsPath(root), '{"hooks":{"PreToolUse":{}}}');
    expect(await runCli(['hooks', 'install'], io(root))).toBe(1);
    expect(await readFile(settingsPath(root), 'utf8')).toBe('{"hooks":{"PreToolUse":{}}}');
  });

  it('rejects unknown subcommands', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    expect(await runCli(['hooks', 'remove'], io(root))).toBe(1);
    expect(existsSync(settingsPath(root))).toBe(false);
  });
});

describe('desk init --hooks', () => {
  it('installs hooks after init', async () => {
    const root = await makeEmptyDir();
    expect(await runCli(['init', '--hooks'], io(root))).toBe(0);
    expect(commands(await readSettings(root), 'PreToolUse')).toEqual(['desk hook agent-start']);
  });

  it('with an invalid settings.json says .desk was created and how to finish', async () => {
    const root = await makeEmptyDir();
    await mkdir(join(root, '.claude'));
    await writeFile(settingsPath(root), '{ broken');
    const x = io(root);
    expect(await runCli(['init', '--hooks'], x)).toBe(1);
    expect(existsSync(join(root, '.desk', 'board.yaml'))).toBe(true);
    const message = x.errLines.join('\n');
    expect(message).toContain('.desk создан');
    expect(message).toContain('desk hooks install');
    expect(await readFile(settingsPath(root), 'utf8')).toBe('{ broken');
  });
});

describe('readStream', () => {
  it('returns an empty string for a TTY without waiting', async () => {
    expect(await readStream(Object.assign(new Readable({ read() {} }), { isTTY: true }))).toBe('');
  });

  it('reads a piped stream to the end', async () => {
    expect(await readStream(Readable.from([Buffer.from('{"a":'), '1}']))).toBe('{"a":1}');
  });
});

describe('desk ui', () => {
  let blocker: Server | undefined;
  afterEach(async () => {
    await new Promise<void>((resolve) => (blocker ? blocker.close(() => resolve()) : resolve()));
    blocker = undefined;
  });

  it('prints a one-line error when the port is busy', async () => {
    const root = await makeProject(BOARD_TEMPLATE);
    const server = createServer();
    blocker = server;
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const x = io(root, '', { env: { DESK_ROOT: root } });
    expect(await runCli(['ui', '--port', String(port)], x)).toBe(1);
    expect(x.errLines).toEqual([`Порт ${port} занят. Запусти desk ui --port <другой порт>.`]);
  });
});
