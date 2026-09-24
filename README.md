# desk

Локальная Kanban-доска для AI-агентов. Данные хранятся в `.desk/`, агенты работают через MCP, а человек — через веб-интерфейс.

## Установка

```bash
npm install
npm run build
npm i -g .
```

## Подключение к проекту

```bash
cd ~/projects/my-app
desk init --claude-md
```

Команда создаёт `.desk/project.yaml`, `.desk/board.yaml`, `.desk/tasks/`, подключение в `.mcp.json` и, с флагом `--claude-md`, добавляет правила работы с доской.

## Tenant и project

Идентичность данных имеет вид `tenant → project`. Она хранится в `.desk/project.yaml`:

```yaml
version: 1
tenant_id: local
project_id: my-app
name: "My app"
```

Один проект по-прежнему полностью работает в локальном режиме: board, задачи, locks и events читаются только из его `.desk/`. Старые проекты без `project.yaml` автоматически получают legacy-контекст `tenant_id: local` и идентификатор из имени каталога; `desk init` создаёт явный metadata-файл без изменения существующих задач.

Чтобы добавить новый проект, перейдите в его корень и выполните `desk init`. Для существующего проекта сначала сохраните резервную копию `.desk/`, затем добавьте `project.yaml` с уникальной парой `tenant_id`/`project_id` и проверьте результат через `desk validate`. Данные не переносятся и не смешиваются: namespaced HTTP-маршруты имеют вид `/api/tenants/:tenant/projects/:project/...`, а MCP-инструменты принимают необязательный контекст `tenant_id` и `project_id`.

Сейчас один запущенный экземпляр desk обслуживает один project root. UI показывает активный tenant/project и готов к нескольким проектам, когда появится внешний registry; до этого переключатель отключён, если доступен только текущий проект.

## Команды

```text
desk init [--claude-md]  создать доску
desk mcp                  запустить MCP-сервер по stdio
desk ui [--port N]       открыть локальную веб-доску
desk validate             проверить board.yaml и задачи
```

По умолчанию UI доступен на `http://127.0.0.1:4717`.

Задачи — Markdown-файлы с YAML-заголовком. Правила колонок, полей, переходов и WIP-лимитов задаются в `.desk/board.yaml`.

Перед релизом проверьте:

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
desk validate
```
