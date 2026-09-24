import { describe, expect, it } from 'vitest';
import {
  agentInput,
  cardLine,
  deriveTitle,
  describeRun,
  firstLine,
  parseHookPayload,
  preToolUseOutput,
  summarizeResponse,
  toAssignee,
  truncate,
} from '../../src/cli/agent-hooks.js';

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('abc', 5)).toBe('abc');
    expect(truncate('abcde', 5)).toBe('abcde');
  });

  it('cuts long text to max chars ending with an ellipsis', () => {
    const cut = truncate('abcdefgh', 5);
    expect(cut).toBe('abcd…');
    expect(cut).toHaveLength(5);
  });
});

describe('firstLine', () => {
  it('returns the first non-empty trimmed line', () => {
    expect(firstLine('\n  \n  Привет мир  \nвторая')).toBe('Привет мир');
  });

  it('returns empty string for blank text', () => {
    expect(firstLine(' \n\t\n')).toBe('');
  });
});

describe('agentInput', () => {
  it('keeps only string fields with expected names', () => {
    expect(agentInput({ description: 'd', prompt: 'p', subagent_type: 'Explore', model: 1 })).toEqual({
      description: 'd',
      prompt: 'p',
      subagentType: 'Explore',
    });
  });

  it('tolerates non-object input', () => {
    expect(agentInput(null)).toEqual({});
    expect(agentInput('x')).toEqual({});
    expect(agentInput({ description: 5, prompt: [], subagent_type: {} })).toEqual({});
  });
});

describe('deriveTitle', () => {
  it('uses the trimmed description with collapsed whitespace', () => {
    expect(deriveTitle({ description: '  Найти\nэндпоинты  ', prompt: 'x' })).toBe('Найти эндпоинты');
  });

  it('falls back to the first non-empty prompt line', () => {
    expect(deriveTitle({ description: '   ', prompt: '\n\nПроверь тесты\nи ещё' })).toBe('Проверь тесты');
  });

  it('falls back to a default title', () => {
    expect(deriveTitle({})).toBe('Сабагент');
    expect(deriveTitle({ prompt: '  \n ' })).toBe('Сабагент');
  });

  it('cuts titles to 200 chars', () => {
    const title = deriveTitle({ description: 'я'.repeat(300) });
    expect(title).toHaveLength(200);
    expect(title.endsWith('…')).toBe(true);
  });
});

describe('toAssignee', () => {
  it('keeps a valid agent type', () => {
    expect(toAssignee('Explore')).toBe('Explore');
  });

  it('replaces forbidden characters and falls back to general-purpose', () => {
    expect(toAssignee('ecc:code-reviewer')).toBe('ecc code-reviewer');
    expect(toAssignee(undefined)).toBe('general-purpose');
    expect(toAssignee(' : · ')).toBe('general-purpose');
    expect(toAssignee('a'.repeat(100))).toHaveLength(64);
  });
});

describe('describeRun', () => {
  it('renders the agent type and the prompt', () => {
    expect(describeRun({ subagentType: 'Explore', prompt: 'Найди всё' })).toBe('**Сабагент:** Explore\n\nНайди всё');
  });

  it('defaults the type and truncates long prompts to 1500 chars', () => {
    const text = describeRun({ prompt: 'x'.repeat(2000) });
    const [head, body] = text.split('\n\n');
    expect(head).toBe('**Сабагент:** general-purpose');
    expect(body).toHaveLength(1500);
    expect(body?.endsWith('…')).toBe(true);
  });
});

describe('summarizeResponse', () => {
  it('takes the first non-empty line of a string response, up to 300 chars', () => {
    expect(summarizeResponse('\nГотово: 3 файла\nдетали')).toBe('Готово: 3 файла');
    expect(summarizeResponse('z'.repeat(500))).toHaveLength(300);
  });

  it('reads text blocks from an Agent result object', () => {
    const response = { status: 'completed', content: [{ type: 'text', text: '\nНашёл 12 эндпоинтов\nещё' }] };
    expect(summarizeResponse(response)).toBe('Нашёл 12 эндпоинтов');
  });

  it('reads a bare content-block array', () => {
    expect(summarizeResponse([{ type: 'text', text: 'Итог' }])).toBe('Итог');
  });

  it('stringifies other objects and cuts to 300 chars', () => {
    expect(summarizeResponse({ ok: true })).toBe('{"ok":true}');
    expect(summarizeResponse({ data: 'q'.repeat(500) })).toHaveLength(300);
  });

  it('returns empty string for missing responses', () => {
    expect(summarizeResponse(undefined)).toBe('');
    expect(summarizeResponse(null)).toBe('');
  });
});

describe('parseHookPayload', () => {
  it('parses a JSON object', () => {
    expect(parseHookPayload('{"tool_name":"Agent"}')).toEqual({ tool_name: 'Agent' });
  });

  it('returns null for invalid JSON or non-objects', () => {
    expect(parseHookPayload('not json')).toBeNull();
    expect(parseHookPayload('[1]')).toBeNull();
    expect(parseHookPayload('null')).toBeNull();
    expect(parseHookPayload('')).toBeNull();
  });
});

describe('preToolUseOutput', () => {
  it('returns the full tool input with the card line appended to the prompt', () => {
    const input = { description: 'd', prompt: 'Сделай', subagent_type: 'Explore', run_in_background: true };
    const output = JSON.parse(preToolUseOutput(input, 'T-007', 'Explore') ?? 'null');
    expect(output).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput: { ...input, prompt: `Сделай${cardLine('T-007', 'Explore')}` },
      },
    });
    expect(input.prompt).toBe('Сделай');
  });

  it('returns null when the prompt is not a string', () => {
    expect(preToolUseOutput({ description: 'd' }, 'T-001', 'x')).toBeNull();
  });

  it('builds the card line verbatim', () => {
    expect(cardLine('T-001', 'Explore')).toBe(
      '\n\n---\nТвоя карточка на доске desk: T-001. Пиши ход работы через MCP tool add_note(id: "T-001", actor: "Explore"). Не создавай для этой работы новую карточку.',
    );
  });
});
