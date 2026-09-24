"use strict";

// kind "to-enum": булев параметр схлопнут в enum-параметр (`action` -> `type="action"`).
// Несколько булевых могут мапиться в один целевой параметр, поэтому группируем по нему.
module.exports = {
  kind: "to-enum",
  messages: {
    toEnum: 'Параметр `{{prop}}` устарел. Используйте `{{target}}="{{value}}"`.',
    toEnumDynamic: 'Параметр `{{prop}}` устарел, замените на `{{target}}="{{value}}"`. Значение динамическое — поправьте вручную.',
    conflictExisting: "Параметр `{{prop}}` устарел, но `{{target}}` уже задан. Уберите `{{prop}}` вручную.",
    conflictMultiple: "Параметры `{{props}}` устарели и мапятся в один `{{target}}`. Оставьте один и задайте `{{target}}` вручную."
  },

  report(items, { context, present }) {
    // Группируем по целевому параметру: несколько булевых могут мапиться в один `type`.
    const byTarget = new Map();
    for (const d of items) {
      const list = byTarget.get(d.spec.prop) || [];
      list.push(d);
      byTarget.set(d.spec.prop, list);
    }

    for (const [target, group] of byTarget) {
      // Неоднозначность: `<TNButton action outline>` — не гадаем, кто победит.
      if (group.length > 1) {
        const names = group.map(g => g.name).join(", ");
        for (const d of group) {
          context.report({
            node: d.entry.attr,
            messageId: "conflictMultiple",
            data: { props: names, target }
          });
        }
        continue;
      }

      const { name, spec, entry } = group[0];

      // Целевой параметр уже задан явно — старый только мешает, но фиксить рискованно.
      if (present.has(target)) {
        context.report({
          node: entry.attr,
          messageId: "conflictExisting",
          data: { prop: name, target }
        });
        continue;
      }

      // Фиксим только когда значение статически известно как «истина».
      const fixable = entry.static ? entry.isBooleanShorthand || entry.value === "true" || entry.value === "" : entry.value === "true"; // :action="true"

      if (fixable) {
        context.report({
          node: entry.attr,
          messageId: "toEnum",
          data: { prop: name, target, value: spec.value },
          fix(fixer) {
            return fixer.replaceText(entry.attr, `${target}="${spec.value}"`);
          }
        });
      } else {
        // :action="cond" — в рантайме неизвестно, автофикс небезопасен.
        context.report({
          node: entry.attr,
          messageId: "toEnumDynamic",
          data: { prop: name, target, value: spec.value }
        });
      }
    }
  }
};
