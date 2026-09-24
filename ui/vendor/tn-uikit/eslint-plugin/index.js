"use strict";

const migrateProps = require("./rules/migrate-props");

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  meta: { name: "@life_uikit/eslint-plugin", version: "7.0.0" },
  rules: {
    "migrate-props": migrateProps
  }
};

// Один набор правил, два пресета — плагин универсален для обоих форматов
// конфигурации ESLint. Отличается только способ регистрации плагина.
plugin.configs = {
  // Legacy `.eslintrc.*` (ESLint 8): плагин резолвится ПО ИМЕНИ пакета
  // `@life_uikit/eslint-plugin` (короткое имя в конфиге — `@life_uikit`).
  // Подключение: `extends: ["plugin:@life_uikit/recommended"]`.
  recommended: {
    plugins: ["@life_uikit"],
    rules: {
      "@life_uikit/migrate-props": "error"
    }
  },
  // Flat config `eslint.config.*` (ESLint 9): плагин передаётся ОБЪЕКТОМ,
  // имя пакета не важно. Подключение: `...uikit.configs["flat/recommended"]`.
  "flat/recommended": {
    plugins: { "@life_uikit": plugin },
    rules: {
      "@life_uikit/migrate-props": "error"
    }
  }
};

module.exports = plugin;
