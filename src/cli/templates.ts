export const BOARD_TEMPLATE = `version: 1
name: desk
id_prefix: T
guide: |
  Канбан-доска проекта. Правила для агентов:
  - Перед созданием задачи ищи дубликаты через list_tasks с query.
  - Одна задача = один законченный результат, который можно проверить.
  - В actor всегда передавай своё имя агента.
  - Решения и находки записывай через add_note.

columns:
  - id: backlog
    title: Backlog
    guide: Новые задачи. Сюда кладётся всё, что не берут в работу сразу.
  - id: in_progress
    title: In progress
    wip_limit: 3
    guide: Задачи в работе. Берёшь задачу — ставь assignee = своё имя.
  - id: review
    title: Review
    guide: Работа сделана и ждёт проверки. Нужна ссылка на PR.
  - id: done
    title: Done
    guide: Проверено и принято.

transitions:
  - from: backlog
    to: in_progress
    requires: [assignee]
  - from: in_progress
    to: review
    requires: [pr_url]
  - from: in_progress
    to: backlog
  - from: in_progress
    to: done
  - from: review
    to: [in_progress, done]

fields:
  - id: priority
    type: enum
    values: [p0, p1, p2, p3]
    required: true
    default: p2
    guide: "p0 — прод лежит. p1 — блокирует другую задачу. p2 — по умолчанию. p3 — nice to have."
  - id: area
    type: enum
    values: [backend, frontend, infra, docs]
    guide: Часть системы, которую меняет задача.
  - id: pr_url
    type: url
    guide: Ссылка на PR. Нужна для перехода в review.
  - id: estimate
    type: number
    min: 0
    guide: Оценка в часах работы агента, не человека.
`;
export const CLAUDE_MD_MARKER = '<!-- desk -->';
export const CLAUDE_MD_SNIPPET = `${CLAUDE_MD_MARKER}
## Канбан-доска desk

Задачи проекта ведём на доске desk через MCP-сервер \`desk\`.

- Перед работой вызови \`get_board\` и следуй \`guide\` доски, колонок и полей.
- В \`actor\` всегда передавай своё имя агента.
- Перед созданием задачи ищи дубликаты: \`list_tasks\` с \`query\`.
- Берёшь задачу — перенеси её через \`move_task\` и заполни поля, которые требует переход.
- Решения и находки записывай через \`add_note\`.
- Если в промпте указана твоя карточка на доске desk — пиши ход работы через add_note в неё и не создавай новую карточку. Если карточки нет — найди свою через list_tasks(assignee: <твой тип>, column: in_progress).
`;
export const DESK_MCP_SERVER = { command: 'desk', args: ['mcp'] } as const;

export interface HookEntry {
  matcher?: string;
  hooks: { type: 'command'; command: string; timeout: number }[];
}

const HOOK_TIMEOUT_S = 10;
const command = (name: string): HookEntry['hooks'] => [{ type: 'command', command: `desk hook ${name}`, timeout: HOOK_TIMEOUT_S }];

/**
 * Хуки Claude Code для карточек сабагентов (без автоодобрения вызовов):
 * PreToolUse создаёт карточку, SubagentStart связывает её с agent_id и отдаёт сабагенту строку карточки,
 * PostToolUse/SubagentStop закрывают её, PostToolUseFailure/PermissionDenied возвращают в первую колонку.
 * Для фоновых сабагентов PostToolUse приходит сразу при запуске (status "async_launched").
 */
export const DESK_HOOKS: readonly { event: string; entry: HookEntry }[] = [
  { event: 'PreToolUse', entry: { matcher: 'Agent|Task', hooks: command('agent-start') } },
  { event: 'SubagentStart', entry: { hooks: command('agent-attach') } },
  { event: 'PostToolUse', entry: { matcher: 'Agent|Task', hooks: command('agent-end') } },
  { event: 'PostToolUseFailure', entry: { matcher: 'Agent|Task', hooks: command('agent-end') } },
  { event: 'PermissionDenied', entry: { matcher: 'Agent|Task', hooks: command('agent-end') } },
  { event: 'SubagentStop', entry: { hooks: command('agent-end') } },
];
