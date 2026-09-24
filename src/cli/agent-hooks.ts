/** Чистые помощники хуков Claude Code: разбор payload, заголовок карточки, сводка ответа сабагента. */

export const HOOK_ACTOR = 'claude-code';
export const DEFAULT_AGENT_TYPE = 'general-purpose';
export const DEFAULT_TITLE = 'Сабагент';
export const AGENT_TOOLS: readonly string[] = ['Agent', 'Task'];

const MAX_TITLE = 200;
const MAX_PROMPT = 1500;
const MAX_SUMMARY = 300;
const MAX_ACTOR = 64;
const MAX_AGENT = 100;
const ELLIPSIS = '…';

export interface AgentInput {
  description?: string;
  prompt?: string;
  subagentType?: string;
  name?: string;
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
  const name = stringAt(toolInput, 'name');
  return {
    ...(description === undefined ? {} : { description }),
    ...(prompt === undefined ? {} : { prompt }),
    ...(subagentType === undefined ? {} : { subagentType }),
    ...(name === undefined ? {} : { name }),
  };
}

export function deriveTitle(input: AgentInput): string {
  const title = oneLine(input.description ?? '') || oneLine(firstLine(input.prompt ?? '')) || DEFAULT_TITLE;
  return truncate(title, MAX_TITLE);
}

const cleanActor = (raw: string | undefined): string =>
  oneLine((raw ?? '').replace(/[:·\r\n]/g, ' ')).slice(0, MAX_ACTOR).trim();

/** Строка как assignee/actor: без ":", "·" и переносов, до 64 символов; пустая — general-purpose. */
export function toAssignee(raw: string | undefined): string {
  return cleanActor(raw) || DEFAULT_AGENT_TYPE;
}

/** assignee карточки: tool_input.name, иначе тип сабагента (оба очищены). */
export function assigneeFor(input: AgentInput): string {
  return cleanActor(input.name) || toAssignee(input.subagentType);
}

/** Нормализованный полный тип сабагента (с `:`), одна строка до 100 символов. */
export function normalizeAgentType(raw: string | undefined): string {
  return truncate(oneLine(raw ?? ''), MAX_AGENT) || DEFAULT_AGENT_TYPE;
}

export function agentType(input: AgentInput): string {
  return normalizeAgentType(input.subagentType);
}

export function describeRun(input: AgentInput): string {
  return `**Сабагент:** ${agentType(input)}\n\n${truncate((input.prompt ?? '').trim(), MAX_PROMPT)}`;
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

export function cardText(id: string, assignee: string): string {
  return `Твоя карточка на доске desk: ${id}. Пиши ход работы через MCP tool add_note(id: "${id}", actor: "${assignee}"). Не создавай для этой работы новую карточку.`;
}

/** stdout SubagentStart: контекст попадает в разговор сабагента до его первого промпта. */
export function subagentStartOutput(additionalContext: string): string {
  return JSON.stringify({ hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext } });
}

export { isObject };
