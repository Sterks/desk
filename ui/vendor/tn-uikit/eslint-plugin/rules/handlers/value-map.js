"use strict";

/** Заменяем только значение параметра (для `value-map`), сохраняя имя и кавычки. */
function valueMapFix(fixer, attr, mapped) {
  if (!attr.directive) {
    // Статичный: `size="big"` -> value это VLiteral вместе с кавычками.
    if (!attr.value) return null;
    return fixer.replaceText(attr.value, `"${mapped}"`);
  }
  // Директива с литеральным выражением: `:size="'big'"`.
  const expr = attr.value && attr.value.expression;
  if (expr && expr.type === "Literal") {
    const quote = typeof expr.raw === "string" && expr.raw[0] === '"' ? '"' : "'";
    return fixer.replaceText(expr, `${quote}${mapped}${quote}`);
  }
  return null;
}

// kind "value-map": устарели конкретные значения параметра, имя остаётся.
module.exports = {
  kind: "value-map",
  messages: {
    valueMap: "Значение `{{from}}` параметра `{{prop}}` устарело. Используйте `{{to}}`.",
    valueMapDynamic: "Значение параметра `{{prop}}` задано динамически — проверьте, не устарело ли оно. Замены: {{pairs}}."
  },

  report(items, { context }) {
    for (const { name, spec, entry } of items) {
      const attr = entry.attr;
      // Достаём текущее значение, только если оно статически известно.
      let from = null;
      let dynamic = false;
      if (entry.static) {
        from = entry.value; // null у булева шортката — маппить нечего
      } else {
        const expr = attr.value && attr.value.expression;
        if (expr && expr.type === "Literal") from = String(expr.value);
        else dynamic = true; // `:size="cond"` — значение в рантайме
      }

      if (dynamic) {
        const pairs = Object.entries(spec.map)
          .map(([k, v]) => `${k} → ${v}`)
          .join(", ");
        context.report({
          node: attr,
          messageId: "valueMapDynamic",
          data: { prop: name, pairs }
        });
        continue;
      }
      // Булев шорткат или значение не из карты — этот атрибут не трогаем.
      if (from == null || !Object.prototype.hasOwnProperty.call(spec.map, from)) continue;

      const to = spec.map[from];
      context.report({
        node: attr,
        messageId: "valueMap",
        data: { prop: name, from, to },
        fix(fixer) {
          return valueMapFix(fixer, attr, to);
        }
      });
    }
  }
};
