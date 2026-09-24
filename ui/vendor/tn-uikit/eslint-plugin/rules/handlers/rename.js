"use strict";

const { normalizeProp } = require("../../core/ast");

/** Узел имени параметра, который правит `rename`: у статического атрибута — сам
 *  ключ, у директивы (`:foo`, `v-bind:foo`) — её аргумент. Значение и префикс
 *  `:`/`v-bind:` при этом не трогаем. Возвращает null для динамического
 *  аргумента (`:[foo]`) — такой автофиксить нельзя. */
function attrNameNode(attr) {
  if (!attr.directive) return attr.key || null;
  const arg = attr.key && attr.key.argument;
  return arg && arg.type === "VIdentifier" ? arg : null;
}

// kind "rename": параметр переименован — меняем только имя, значение и
// способ передачи (`:foo`/`v-bind:foo`) сохраняем.
module.exports = {
  kind: "rename",
  messages: {
    rename: "Параметр `{{prop}}` переименован в `{{to}}`.",
    renameConflict: "Параметр `{{prop}}` переименован в `{{to}}`, но `{{to}}` уже задан. Уберите `{{prop}}` вручную.",
    renameDynamicArg: "Параметр `{{prop}}` переименован в `{{to}}`. Динамический аргумент — переименуйте вручную."
  },

  report(items, { context, presentNorm }) {
    for (const { name, spec, entry } of items) {
      // Новое имя уже задано на элементе — оба разом фиксить рискованно.
      if (presentNorm.has(normalizeProp(spec.to))) {
        context.report({
          node: entry.attr,
          messageId: "renameConflict",
          data: { prop: name, to: spec.to }
        });
        continue;
      }
      const nameNode = attrNameNode(entry.attr);
      if (!nameNode) {
        // Динамический аргумент (`:[foo]`) — имя вычисляется в рантайме.
        context.report({
          node: entry.attr,
          messageId: "renameDynamicArg",
          data: { prop: name, to: spec.to }
        });
        continue;
      }
      context.report({
        node: entry.attr,
        messageId: "rename",
        data: { prop: name, to: spec.to },
        fix(fixer) {
          return fixer.replaceText(nameNode, spec.to);
        }
      });
    }
  }
};
