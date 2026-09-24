"use strict";

/** Нормализуем имя тега/компонента: убираем дефисы, в нижний регистр.
 *  Так `<TNButton>` и `<tn-button>` сматчатся на одну спеку. */
function normalizeName(name) {
  return String(name || "")
    .replace(/-/g, "")
    .toLowerCase();
}

/** Нормализуем имя параметра: `mobileBreakPoint` и `mobile-break-point`
 *  (в т.ч. `:mobile-break-point`) — это один и тот же проп. */
function normalizeProp(name) {
  return String(name || "")
    .replace(/-/g, "")
    .toLowerCase();
}

/**
 * Читаем атрибут VAttribute в единый вид, независимо от того статичный он или v-bind.
 * @returns {null | {name: string, static: boolean, isBooleanShorthand: boolean, value: string|null, attr: object}}
 */
function readAttr(attr) {
  // Статичный атрибут: `action`, `type="link"`, `action=""`
  if (!attr.directive) {
    const name = attr.key && attr.key.name;
    if (!name) return null;
    const isBooleanShorthand = attr.value == null;
    const value = attr.value && attr.value.value != null ? String(attr.value.value) : null;
    return { name, static: true, isBooleanShorthand, value, attr };
  }

  // Директива: интересует только v-bind (`:action="..."`, `v-bind:action="..."`)
  const key = attr.key;
  const isBind = key && key.name && key.name.name === "bind";
  const arg = key && key.argument;
  if (isBind && arg && arg.type === "VIdentifier") {
    const expr = attr.value && attr.value.expression;
    let value = null;
    if (expr && expr.type === "Literal") value = String(expr.value);
    return { name: arg.name, static: false, isBooleanShorthand: false, value, attr };
  }
  return null;
}

module.exports = { normalizeName, normalizeProp, readAttr };
