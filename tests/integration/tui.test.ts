import { describe, expect, it } from 'vitest';
import { runCli, type CliIo } from '../../src/cli/run.js';
import { parseTuiArgs, resolveTuiBinary } from '../../src/cli/tui.js';
import { makeProject } from '../helpers/project.js';

const none = () => false;

describe('resolveTuiBinary', () => {
  it('отдаёт DESK_TUI_BIN первым, если файл существует', () => {
    const found = resolveTuiBinary({ DESK_TUI_BIN: '/custom/desk-tui', PATH: '/bin' }, (p) => p === '/custom/desk-tui', '/pkg/tui/bin/desk-tui');
    expect(found).toBe('/custom/desk-tui');
  });

  it('падает на собранный tui/bin, затем на PATH', () => {
    const bundled = '/pkg/tui/bin/desk-tui';
    expect(resolveTuiBinary({ PATH: '/a:/b' }, (p) => p === bundled, bundled)).toBe(bundled);
    expect(resolveTuiBinary({ PATH: '/a:/b' }, (p) => p === '/b/desk-tui', bundled)).toBe('/b/desk-tui');
  });

  it('возвращает null, когда бинаря нет нигде', () => {
    expect(resolveTuiBinary({ DESK_TUI_BIN: '/nope', PATH: '/a' }, none, '/pkg/tui/bin/desk-tui')).toBeNull();
  });
});

describe('parseTuiArgs', () => {
  it('принимает пустые аргументы', () => expect(() => parseTuiArgs([])).not.toThrow());
  it('отвергает неизвестные', () => expect(() => parseTuiArgs(['--x'])).toThrow('Неизвестные аргументы: --x'));
});

function io(cwd: string, env: NodeJS.ProcessEnv = {}) {
  const outLines: string[] = [];
  const errLines: string[] = [];
  return { cwd, env, readStdin: async () => '', out: (x: string) => outLines.push(x), err: (x: string) => errLines.push(x), outLines, errLines } as CliIo & {
    outLines: string[];
    errLines: string[];
  };
}

describe('desk tui', () => {
  it('без бинаря печатает подсказку и возвращает 1', async () => {
    const root = await makeProject();
    const { runTui } = await import('../../src/cli/tui.js');
    const deps = { resolve: () => null, run: async () => 0 };
    await expect(runTui([], io(root), deps)).rejects.toThrow(/desk-tui.*build:tui/);
  });

  it('runCli превращает отсутствие бинаря в код 1 (через неизвестный аргумент)', async () => {
    const x = io(await makeProject());
    expect(await runCli(['tui', '--x'], x)).toBe(1);
    expect(x.errLines.join('\n')).toContain('Неизвестные аргументы: --x');
  });

  it('поднимает API, запускает бинарь с --api и возвращает его код', async () => {
    const root = await makeProject();
    const { runTui } = await import('../../src/cli/tui.js');
    let apiUrl = '';
    let boardName = '';
    const code = await runTui([], io(root), {
      resolve: () => '/fake/desk-tui',
      run: async (bin, args) => {
        expect(bin).toBe('/fake/desk-tui');
        expect(args[0]).toBe('--api');
        apiUrl = args[1] ?? '';
        const res = await fetch(`${apiUrl}/api/board`);
        boardName = ((await res.json()) as { data: { name: string } }).data.name;
        return 7;
      },
    });
    expect(code).toBe(7);
    expect(boardName).not.toBe('');
    await expect(fetch(`${apiUrl}/api/board`)).rejects.toThrow();
  });
});
