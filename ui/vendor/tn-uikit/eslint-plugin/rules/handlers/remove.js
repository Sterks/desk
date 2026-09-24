"use strict";

/**
 * Удаляем атрибут целиком вместе с ведущим пробелом, чтобы не оставалось
 * `<TNSelect  >` или залипших друг к другу параметров.
 */
function removeAttrFix(fixer, element, attr, sourceCode) {
  const attrs = element.startTag.attributes;
  const idx = attrs.indexOf(attr);
  const end = attr.range[1];
  let start = attr.range[0];
  if (idx > 0) {
    // Съедаем пробелы между предыдущим параметром и этим.
    start = attrs[idx - 1].range[1];
  } else {
    // Первый параметр — съедаем пробелы после имени тега.
    const text = sourceCode.text;
    while (start > 0 && /\s/.test(text[start - 1])) start--;
  }
  return fixer.removeRange([start, end]);
}

// kind "remove": параметр удалён из компонента — просто убираем атрибут.
// Значение не важно (статика, шорткат, :bind) — фикс всегда безопасен.
module.exports = {
  kind: "remove",
  messages: {
    removed: "Параметр `{{prop}}` удалён и больше не поддерживается. Уберите его.",
    removedHint: "Параметр `{{prop}}` удалён и больше не поддерживается. {{hint}}"
  },

  report(items, { context, node, sourceCode }) {
    for (const { name, spec, entry } of items) {
      context.report({
        node: entry.attr,
        messageId: spec.hint ? "removedHint" : "removed",
        data: { prop: name, hint: spec.hint || "" },
        fix(fixer) {
          return removeAttrFix(fixer, node, entry.attr, sourceCode);
        }
      });
    }
  }
};
