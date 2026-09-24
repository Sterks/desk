"use strict";

const { byComponent } = require("../core/registry");
const { normalizeName, normalizeProp, readAttr } = require("../core/ast");
const handlers = require("./handlers");

// messageId -> текст: собираем из всех хендлеров (у каждого вида свои сообщения).
const messages = {};
for (const h of handlers) Object.assign(messages, h.messages);

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Мигрирует устаревшие параметры компонентов @life_uikit/uikit и чинит их автофиксом",
      recommended: true
    },
    fixable: "code",
    schema: [],
    messages
  },

  create(context) {
    const sourceCode = context.sourceCode || context.getSourceCode();
    const services = sourceCode.parserServices;
    // Не Vue-файл (нет шаблонного парсера) — правило молчит.
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      VElement(node) {
        const record = byComponent.get(normalizeName(node.rawName));
        if (!record) return;
        const { props } = record;

        // Все атрибуты элемента в удобном виде.
        const present = new Map(); // propName (как написан) -> info (в т.ч. .attr)
        for (const attr of node.startTag.attributes) {
          const info = readAttr(attr);
          if (info) present.set(info.name, info);
        }
        // Нормализованные имена уже заданных параметров — для проверки конфликтов
        // (`mobile-break-point` и `mobileBreakPoint` считаются одним).
        const presentNorm = new Set();
        for (const name of present.keys()) presentNorm.add(normalizeProp(name));

        // Раскидываем устаревшие параметры элемента по виду миграции.
        const byKind = new Map(); // kind -> [{ name, spec, entry }]
        for (const [name, entry] of present) {
          const hit = props.get(normalizeProp(name));
          if (!hit) continue;
          const list = byKind.get(hit.spec.kind) || [];
          list.push({ name, spec: hit.spec, entry });
          byKind.set(hit.spec.kind, list);
        }
        if (byKind.size === 0) return;

        // Каждый вид обрабатывает свой хендлер. Идём в порядке хендлеров —
        // так отчёты на одном элементе детерминированы независимо от порядка атрибутов.
        const shared = { context, node, sourceCode, present, presentNorm };
        for (const handler of handlers) {
          const items = byKind.get(handler.kind);
          if (items) handler.report(items, shared);
        }
      }
    });
  }
};
