import { describe, expect, it } from 'vitest';
import {
  agentInput,
  agentType,
  assigneeFor,
  cardText,
  deriveTitle,
  describeRun,
  firstLine,
  parseHookPayload,
  subagentStartOutput,
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
    expect(agentInput({ description: 'd', prompt: 'p', subagent_type: 'Explore', name: 'scout', model: 1 })).toEqual({
      description: 'd',
      prompt: 'p',
      subagentType: 'Explore',
      name: 'scout',
    });
  });

  it('tolerates non-object input', () => {
    expect(agentInput(null)).toEqual({});
    expect(agentInput('x')).toEqual({});
    expect(agentInput({ description: 5, prompt: [], subagent_type: {}, name: 1 })).toEqual({});
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

describe('assigneeFor / agentType', () => {
  it('prefers the sanitized tool_input.name', () => {
    expect(assigneeFor({ name: 'lead:reviewer', subagentType: 'ecc:code-reviewer' })).toBe('lead reviewer');
  });

  it('falls back to the sanitized subagent type when name is blank or missing', () => {
    expect(assigneeFor({ name: ' : ', subagentType: 'ecc:code-reviewer' })).toBe('ecc code-reviewer');
    expect(assigneeFor({ subagentType: 'Explore' })).toBe('Explore');
    expect(assigneeFor({})).toBe('general-purpose');
  });

  it('keeps the full type for the agent field, single line, up to 100 chars', () => {
    expect(agentType({ subagentType: ' ecc:code-reviewer ' })).toBe('ecc:code-reviewer');
    expect(agentType({})).toBe('general-purpose');
    expect(agentType({ subagentType: `a\nb${'x'.repeat(200)}` })).toHaveLength(100);
  });
});

describe('subagentStartOutput', () => {
  it('builds the card text verbatim', () => {
    expect(cardText('T-001', 'Explore')).toBe(
      'Твоя карточка на доске desk: T-001. Пиши ход работы через MCP tool add_note(id: "T-001", actor: "Explore"). Не создавай для этой работы новую карточку.',
    );
  });

  it('wraps it as SubagentStart additionalContext', () => {
    expect(JSON.parse(subagentStartOutput('ctx'))).toEqual({
      hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: 'ctx' },
    });
  });
});
