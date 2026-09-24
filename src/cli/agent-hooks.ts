/** Чистые помощники хуков Claude Code: разбор payload, заголовок карточки, сводка ответа сабагента. */

export const HOOK_ACTOR = 'claude-code';
export const DEFAULT_AGENT_TYPE = 'general-purpose';
export const DEFAULT_TITLE = 'Сабагент';
export const AGENT_TOOLS: readonly string[] = ['Agent', 'Task'];

const MAX_TITLE = 200;
const MAX_PROMPT = 1500;
const MAX_SUMMARY = 300;
const MAX_ACTOR = 64;
const ELLIPSIS = '…';

export interface AgentInput {
  description?: string;
  prompt?: string;
  subagentType?: string;
}

export type HookPayload = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const stringAt = (obj: Record<string, unknown>, key: string): string | undefined =>
  typeof obj[key] === 'string' ? obj[key] : undefined;

/** Обрезает до max символов включая «…». */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}${ELLIPSIS}`;
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/).map((line) => line.trim()).find((line) => line !== '') ?? '';
}

const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

export function parseHookPayload(text: string): HookPayload | null {
  try {
    const value: unknown = JSON.parse(text);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

export function agentInput(toolInput: unknown): AgentInput {
  if (!isObject(toolInput)) return {};
  const description = stringAt(toolInput, 'description');
  const prompt = stringAt(toolInput, 'prompt');
  const subagentType = stringAt(toolInput, 'subagent_type');
  return {
    ...(description === undefined ? {} : { description }),
    ...(prompt === undefined ? {} : { prompt }),
    ...(subagentType === undefined ? {} : { subagentType }),
  };
}

export function deriveTitle(input: AgentInput): string {
  const title = oneLine(input.description ?? '') || oneLine(firstLine(input.prompt ?? '')) || DEFAULT_TITLE;
  return truncate(title, MAX_TITLE);
}

/** Тип сабагента как assignee/actor: без ":", "·" и переносов, до 64 символов. */
export function toAssignee(raw: string | undefined): string {
  const cleaned = oneLine((raw ?? '').replace(/[:·\r\n]/g, ' ')).slice(0, MAX_ACTOR).trim();
  return cleaned || DEFAULT_AGENT_TYPE;
}

export function describeRun(input: AgentInput): string {
  const type = input.subagentType?.trim() || DEFAULT_AGENT_TYPE;
  return `**Сабагент:** ${type}\n\n${truncate((input.prompt ?? '').trim(), MAX_PROMPT)}`;
}

function textBlocks(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const texts = value.flatMap((block) => (isObject(block) && typeof block.text === 'string' ? [block.text] : []));
  return texts.length > 0 ? texts.join('\n') : null;
}

/** Первая непустая строка ответа сабагента (строка, блоки content или JSON), до 300 символов. */
export function summarizeResponse(response: unknown): string {
  if (response === undefined || response === null) return '';
  if (typeof response === 'string') return truncate(firstLine(response), MAX_SUMMARY);
  const text = textBlocks(response) ?? (isObject(response) ? textBlocks(response.content) : null);
  if (text !== null) return truncate(firstLine(text), MAX_SUMMARY);
  return truncate(JSON.stringify(response), MAX_SUMMARY);
}

export function cardLine(id: string, assignee: string): string {
  return `\n\n---\nТвоя карточка на доске desk: ${id}. Пиши ход работы через MCP tool add_note(id: "${id}", actor: "${assignee}"). Не создавай для этой работы новую карточку.`;
}

/**
 * JSON для stdout PreToolUse: полный tool_input с дописанной строкой карточки.
 * updatedInput заменяет весь ввод инструмента и применяется вместе с permissionDecision.
 */
export function preToolUseOutput(toolInput: Record<string, unknown>, id: string, assignee: string): string | null {
  const prompt = toolInput.prompt;
  if (typeof prompt !== 'string') return null;
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      updatedInput: { ...toolInput, prompt: `${prompt}${cardLine(id, assignee)}` },
    },
  });
}

export { isObject };
