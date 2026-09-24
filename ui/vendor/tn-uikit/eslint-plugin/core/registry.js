"use strict";

const migrations = require("../migrations");
const { normalizeName, normalizeProp } = require("./ast");

/**
 * Реестр миграций для быстрого поиска в правиле. Строится один раз при загрузке.
 * component (normalized) -> { migration, props: Map<normProp, {canonical, spec}> }.
 */
const byComponent = new Map();
for (const m of migrations) {
  const props = new Map();
  for (const [key, spec] of Object.entries(m.props || {})) {
    props.set(normalizeProp(key), { canonical: key, spec });
  }
  byComponent.set(normalizeName(m.component), { migration: m, props });
}

module.exports = { byComponent };
