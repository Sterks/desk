#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const defaultIconsPath = path.join(__dirname, "components", "icons", "default-icons.ts");
const customIconsPath = path.join(__dirname, "components", "icons", "custom-icons.ts");
const logFilePath = path.join(__dirname, "logs.txt");

const iconNameRegexp = /"([^"]+)"/g;

const log = text => {
  const row = `${new Date().toISOString()}: ${text}\n`;

  if (fs.existsSync(logFilePath)) {
    fs.appendFileSync(logFilePath, row);
  } else {
    fs.writeFileSync(logFilePath, row, { flag: "w" });
  }
};

/** Пишет и в `logs.txt`, и в stdout — чтобы результат был виден при ручном запуске через npx **/
const report = text => {
  log(text);
  console.log(text);
};

/**
 * Корень проекта, в который установлен кит. Определяется по собственному пути, а не по cwd:
 * скрипт выполняется из npm-хука `postinstall`, и рабочая директория не гарантирована.
 * Берётся первый `node_modules` в пути — при вложенной установке нужен внешний проект,
 * а не промежуточный пакет. `null` означает, что кит не установлен как зависимость
 * (запуск в собственном репозитории).
 *
 * @return {string | null}
 */
const getConsumerRoot = () => {
  const segments = __dirname.split(path.sep);
  const nodeModulesIndex = segments.indexOf("node_modules");

  return nodeModulesIndex === -1 ? null : segments.slice(0, nodeModulesIndex).join(path.sep);
};

/**
 * Имена иконок из базового списка кита. Нужны только чтобы не дублировать их в кастомных:
 * если файл прочитать не удалось, фильтрация просто не выполняется.
 *
 * @return {string[]}
 */
const readDefaultNames = () => {
  try {
    return [...fs.readFileSync(defaultIconsPath, "utf8").matchAll(iconNameRegexp)].map(match => match[1]);
  } catch (error) {
    log(`could not read ${defaultIconsPath}: ${error.message}`);
    return [];
  }
};

/**
 * Пересобирает `custom-icons.ts` по списку из `package.json` потребителя: новые имена добавляются,
 * пропавшие исчезают, повторы и пересечения с базовым списком отбрасываются.
 *
 * @param typesArray { string[] }
 */
const syncTypes = typesArray => {
  const defaultNames = readDefaultNames();
  const customNames = [];

  typesArray.forEach(name => {
    if (!defaultNames.includes(name) && !customNames.includes(name)) {
      customNames.push(name);
    }
  });

  const content = customNames.length
    ? `export const CustomIconNames = [\n${customNames.map(name => `  "${name}"`).join(",\n")}\n] as const;\n`
    : "export const CustomIconNames = [] as const;\n";

  if (fs.existsSync(customIconsPath) && fs.readFileSync(customIconsPath, "utf8") === content) {
    report(`custom icon names are up to date: custom=${customNames.length}`);
    return;
  }

  fs.writeFileSync(customIconsPath, content);
  report(`custom icon names updated: custom=${customNames.length}`);
};

/** Собирает `custom-icons.ts` по `tn-ui-kit.external-icon-names` из `package.json` потребителя **/
const syncIcons = () => {
  log("run sync-icons");

  const consumerRoot = getConsumerRoot();

  if (!consumerRoot) {
    report("package is not installed as a dependency, nothing to sync");
    return;
  }

  const packagePath = path.join(consumerRoot, "package.json");

  if (!fs.existsSync(packagePath)) {
    report(`could not found ${packagePath}`);
    return;
  }

  /**
   * @type { { "tn-ui-kit"?: { "external-icon-names"?: string[] } } }
   */
  const parentPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  /**
   *
   * @type {{"external-icon-names"?: string[]}}
   */
  const packageSettings = parentPackage["tn-ui-kit"] || {};

  const externalIconNames = packageSettings["external-icon-names"];

  syncTypes(Array.isArray(externalIconNames) ? externalIconNames : []);
};

/** Команды кита. Ключ — то, что передаётся аргументом: `npx @life_uikit/uikit <команда>` **/
const commands = {
  "sync-icons": syncIcons
};

const printUsage = () => {
  console.log("Использование: npx @life_uikit/uikit <команда>\n");
  console.log("Команды:");
  console.log("  sync-icons  актуализировать IconNames по tn-ui-kit.external-icon-names");
};

const [commandName] = process.argv.slice(2);

if (!commandName || commandName === "--help" || commandName === "-h") {
  printUsage();
} else if (!commands[commandName]) {
  console.error(`Неизвестная команда: ${commandName}\n`);
  printUsage();
  process.exitCode = 1;
} else {
  // Команда висит на `postinstall` и не имеет права уронить установку у потребителя,
  // поэтому любая ошибка только логируется, а код возврата остаётся нулевым.
  try {
    commands[commandName]();
  } catch (error) {
    log(`${commandName} failed: ${error.message}`);
    console.error(`${commandName} failed: ${error.message}`);
  }
}
