"use strict";

/**
 * Хелпер-идентити: существует ради типизации/автокомплита в спеках миграций.
 * @type {import("./define-migration").defineMigration}
 */
function defineMigration(migration) {
  return migration;
}

module.exports = { defineMigration };
